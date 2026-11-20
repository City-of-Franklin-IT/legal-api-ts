import { randomUUID } from 'crypto'
import { Op } from 'sequelize'
import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import { signRequesterToken } from '@/utils/requesterToken'
import isUuid from '@/utils/isUuid'
import detectFileType from '@/utils/detectFileType'
import { sequelize, Requester, Offense, Approval, Correspondence, Attachment } from '@/models/traffic-citation'
import { sendAttachment } from './attachment'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import { ControllerResponse } from '@/controllers/types'
import * as Types from '@/models/traffic-citation/types'

type RequesterRecord = Model<Types.RequesterInterface> & Types.RequesterInterface
type OffenseRecord = Model<Types.OffenseInterface> & Types.OffenseInterface
type CorrespondenceRecord = Model<Types.CorrespondenceInterface> & Types.CorrespondenceInterface
type AttachmentRecord = Model<Types.AttachmentInterface> & Types.AttachmentInterface

const CORRECTABLE_TYPES = Types.OFFENSE_TYPES.filter(type => type !== 'DRIVING_SCHOOL')

// Proof can be added only while staff have not decided, or have asked for more
const OPEN_FOR_PROOF: Types.Outcome[] = ['SUBMITTED', 'MORE_INFO']

// Requesters never see internal attachments
const visibleToRequester = (parentId: string) => ({
  parentId,
  isInternal: { [Op.or]: [false, null] }
})

const digits = (value: string) => value.replace(/\D/g, '')

// "+1 (615) 555-0100" and "6155550100" are the same number
const normalizePhone = (value: string) => {
  const d = digits(value)

  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d
}

const isRealDate = (value: string) => {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${ value }T00:00:00Z`)

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const text = (value: unknown, max: number) => typeof value === 'string' && value.trim() && value.trim().length <= max ? value.trim() : null

type CreateBody = Partial<Types.RequesterCreateInterface> & { offenses?: unknown }

//@desc    Initial public submission. Creates the request and its offenses; returns a short-lived token and the offense uuids so proof can be uploaded.
//@route   POST /api/v2/legal/traffic-citation/public/request
//@access  Public (rate limited)
export const createRequest = asyncHandler(async (req: Request<{}, {}, CreateBody>, res: Response, next: NextFunction) => {
  const body = req.body ?? {}

  const requestType = body.requestType
  const firstName = text(body.firstName, 50)
  const lastName = text(body.lastName, 50)
  const email = text(body.email, 255)
  const phone = text(body.phone, 20)

  if(!requestType || !(Types.REQUEST_TYPES as readonly string[]).includes(requestType)) {
    return next(new ErrorResponse('A valid requestType is required', 400))
  }

  if(!firstName || !lastName) {
    return next(new ErrorResponse('First and last name are required', 400))
  }

  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return next(new ErrorResponse('A valid email is required', 400))
  }

  if(!phone || normalizePhone(phone).length < 10) {
    return next(new ErrorResponse('A valid phone number is required', 400))
  }

  // Either a citation number, or license number + state + date of birth
  const citationNumber = text(body.citationNumber, 20)

  let licenseNumber: string | null = null
  let licenseState: string | null = null
  let dob: string | null = null

  if(!citationNumber) {
    licenseNumber = text(body.licenseNumber, 25)
    licenseState = typeof body.licenseState === 'string' ? body.licenseState.trim().toUpperCase() : null
    dob = typeof body.dob === 'string' ? body.dob : null

    if(!licenseNumber || !/^[A-Za-z0-9-]+$/.test(licenseNumber)) {
      return next(new ErrorResponse('A citation number, or a license number with letters, numbers and dashes, is required', 400))
    }

    if(!licenseState || !/^[A-Z]{2}$/.test(licenseState)) {
      return next(new ErrorResponse('A two-letter license state is required', 400))
    }

    if(!dob || !isRealDate(dob) || dob > new Date().toISOString().slice(0, 10) || dob < '1900-01-01') {
      return next(new ErrorResponse('A valid date of birth is required', 400))
    }
  }

  // A driving school request is one offense; a correctable request is one or more of the six types
  let offenseTypes: Types.OffenseType[]

  if(requestType === 'DRIVING_SCHOOL') {
    offenseTypes = ['DRIVING_SCHOOL']
  } else {
    const offenses = body.offenses

    if(!Array.isArray(offenses) || offenses.length < 1 || offenses.length > CORRECTABLE_TYPES.length || new Set(offenses).size !== offenses.length || !offenses.every(type => (CORRECTABLE_TYPES as readonly unknown[]).includes(type))) {
      return next(new ErrorResponse('Choose one or more different offense types', 400))
    }

    offenseTypes = offenses as Types.OffenseType[]
  }

  // Sign first: if the token can't be made, nothing has been written yet
  const uuid = randomUUID()
  const token = signRequesterToken(uuid)

  const created = await sequelize.transaction(async (transaction) => {
    const requester = await Requester.create({
      uuid, requestType, citationNumber, firstName, lastName, email, phone, licenseNumber, licenseState, dob
    } as Types.RequesterInterface, { transaction }) as RequesterRecord

    const offenses: OffenseRecord[] = []

    for(const offenseType of offenseTypes) {
      offenses.push(await Offense.create({ parentId: requester.uuid, offenseType, outcome: 'SUBMITTED' } as Types.OffenseInterface, { transaction }) as OffenseRecord)
    }

    return { requester, offenses }
  })

  res.status(201).json({
    success: true,
    data: {
      uuid: created.requester.uuid,
      token,
      offenses: created.offenses.map(({ uuid, offenseType }) => ({ uuid, offenseType }))
    }
  })
})

//@desc    The defendant proves it is their request by confirming email and phone; returns a short-lived token
//@route   POST /api/v2/legal/traffic-citation/public/request/:uuid/verify
//@access  Public (rate limited per IP and per request)
export const verifyRequest = asyncHandler(async (req: Request<{ uuid: string }, {}, { email?: string, phone?: string }>, res: Response, next: NextFunction) => {
  const { email, phone } = req.body ?? {}

  const requester = typeof email === 'string' && typeof phone === 'string' ?
    await Requester.findOne({ where: { uuid: req.params.uuid } }) as RequesterRecord | null :
    null

  // Same answer for an unknown request, a wrong email and a wrong phone, so nothing about the request leaks
  const matches = !!requester &&
    requester.email.trim().toLowerCase() === email!.trim().toLowerCase() &&
    normalizePhone(requester.phone) === normalizePhone(phone!)

  if(!matches) {
    return next(new ErrorResponse('Those details do not match this request', 401))
  }

  res.status(200).json({ success: true, data: { token: signRequesterToken(requester!.uuid) } })
})

//@desc    The defendant's own request: offenses with outcomes, amounts, the More info note, files and messages. No license, DOB, phone or staff identities.
//@route   GET /api/v2/legal/traffic-citation/public/me
//@access  Requester token
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const requester = req.requester!

  const [offenses, attachments, correspondences] = await Promise.all([
    Offense.findAll({ where: { parentId: requester.uuid }, order: [['id', 'asc']] }) as Promise<OffenseRecord[]>,
    Attachment.findAll({ where: visibleToRequester(requester.uuid), order: [['createdAt', 'asc']] }) as Promise<AttachmentRecord[]>,
    Correspondence.findAll({ where: { parentId: requester.uuid }, order: [['createdAt', 'asc']] }) as Promise<CorrespondenceRecord[]>
  ])

  res.status(200).json({
    success: true,
    data: {
      uuid: requester.uuid,
      requestType: requester.requestType,
      firstName: requester.firstName,
      lastName: requester.lastName,
      citationNumber: requester.citationNumber,
      dueDate: requester.dueDate,
      createdAt: requester.createdAt,
      offenses: offenses.map(offense => ({
        uuid: offense.uuid,
        offenseType: offense.offenseType,
        outcome: offense.outcome,
        amount: offense.amount,
        staffNote: offense.outcome === 'MORE_INFO' ? offense.staffNote : null,
        attachments: attachments
          .filter(attachment => attachment.offenseUuid === offense.uuid)
          .map(({ uuid, fileName, fileSize, createdAt }) => ({ uuid, fileName, fileSize, createdAt }))
      })),
      correspondence: correspondences.map(({ uuid, offenseUuid, message, createdAt, createdBy }) => ({
        uuid,
        offenseUuid,
        message,
        createdAt,
        fromDefendant: createdBy === requester.email.toLowerCase()
      }))
    }
  })
})

//@desc    Get the requester's correspondence
//@route   GET /api/v2/legal/traffic-citation/public/correspondence
//@access  Requester token
export const getCorrespondences = asyncHandler(async (req: Request, res: Response<ControllerResponse & { data: unknown }>) => {
  const requester = req.requester!

  const correspondences = await Correspondence.findAll({
    where: { parentId: requester.uuid },
    order: [['createdAt', 'asc']]
  }) as CorrespondenceRecord[]

  res.status(200).json({
    success: true,
    data: correspondences.map(({ uuid, offenseUuid, message, createdAt, createdBy }) => ({
      uuid, offenseUuid, message, createdAt, fromDefendant: createdBy === requester.email.toLowerCase()
    }))
  })
})

//@desc    Add correspondence to the requester's request
//@route   POST /api/v2/legal/traffic-citation/public/correspondence
//@access  Requester token
export const createCorrespondence = asyncHandler(async (req: Request<{}, {}, { message?: string, offenseUuid?: string }>, res: Response, next: NextFunction) => {
  const { message, offenseUuid } = req.body ?? {}
  const requester = req.requester!

  if(typeof message !== 'string' || !message.trim() || message.length > 5000) {
    return next(new ErrorResponse('A message of up to 5000 characters is required', 400))
  }

  if(offenseUuid !== undefined && offenseUuid !== null) {
    if(!isUuid(offenseUuid) || !await Offense.findOne({ where: { uuid: offenseUuid, parentId: requester.uuid } })) {
      return next(new ErrorResponse('That offense does not belong to your request', 400))
    }
  }

  const correspondence = await Correspondence.create({
    parentId: requester.uuid,
    offenseUuid: offenseUuid ?? null,
    message: message.trim(),
    createdBy: requester.email.toLowerCase()
  } as Types.CorrespondenceInterface) as CorrespondenceRecord

  res.status(201).json({ success: true, data: { uuid: correspondence.uuid, createdAt: correspondence.createdAt } })
})

//@desc    List the requester's non-internal attachments (without file contents)
//@route   GET /api/v2/legal/traffic-citation/public/attachment
//@access  Requester token
export const getAttachments = asyncHandler(async (req: Request, res: Response) => {
  const attachments = await Attachment.findAll({
    where: visibleToRequester(req.requester!.uuid),
    order: [['createdAt', 'asc']]
  }) as AttachmentRecord[]

  res.status(200).json({
    success: true,
    data: attachments.map(({ uuid, offenseUuid, fileName, contentType, fileSize, createdAt }) => ({ uuid, offenseUuid, fileName, contentType, fileSize, createdAt }))
  })
})

//@desc    Download one of the requester's non-internal attachments
//@route   GET /api/v2/legal/traffic-citation/public/attachment/:uuid/download
//@access  Requester token
export const downloadAttachment = asyncHandler(async (req: Request<{ uuid: string }>, res: Response, next: NextFunction) => {
  const attachment = await Attachment.unscoped().findOne({
    where: { ...visibleToRequester(req.requester!.uuid), uuid: req.params.uuid }
  }) as AttachmentRecord | null

  if(!attachment) {
    return next(new ErrorResponse(`Unable to return attachment by uuid ${ req.params.uuid }`, 404))
  }

  sendAttachment(res, attachment)
})

// Strip any path, control characters and quotes the browser sent; never trust it for anything but display
const cleanFileName = (name: string) => {
  const base = name.split(/[\\/]/).pop() ?? ''
  const cleaned = base.replace(/[\u0000-\u001f\u007f"]/g, '').trim().slice(0, 255)

  return cleaned || 'proof'
}

//@desc    Upload proof for one of the requester's offenses (multipart: file field "attachment", optional caption)
//@route   POST /api/v2/legal/traffic-citation/public/offense/:uuid/attachment
//@access  Requester token
export const createAttachment = asyncHandler(async (req: Request<{ uuid: string }, {}, { caption?: string }>, res: Response, next: NextFunction) => {
  const requester = req.requester!
  const file = req.file!

  const offense = await Offense.findOne({ where: { uuid: req.params.uuid, parentId: requester.uuid } }) as OffenseRecord | null

  if(!offense) {
    return next(new ErrorResponse('That offense does not belong to your request', 404))
  }

  if(!OPEN_FOR_PROOF.includes(offense.outcome)) {
    return next(new ErrorResponse('This offense has already been decided', 409))
  }

  // One file per offense (SPEC F17, decided 2026-11-20). After staff ask for more info the defendant may send one
  // more file, so only files added since the latest staff decision count; earlier files are kept for the record.
  const latestDecision = await Approval.findOne({ where: { parentId: offense.uuid }, order: [['createdAt', 'desc']] }) as (Model<Types.ApprovalInterface> & Types.ApprovalInterface) | null

  const alreadySent = await Attachment.count({
    where: {
      offenseUuid: offense.uuid,
      ...(latestDecision && { createdAt: { [Op.gt]: latestDecision.createdAt } })
    }
  })

  if(alreadySent >= 1) {
    return next(new ErrorResponse('This offense already has a file. You can send another only if the court asks for more information.', 409))
  }

  const email = requester.email.toLowerCase()

  // The type comes from the file's own bytes (checked by the upload middleware), never from the browser
  const fileType = detectFileType(file.buffer)!

  const created = await sequelize.transaction(async (transaction) => {
    const attachment = await Attachment.create({
      parentId: requester.uuid,
      offenseUuid: offense.uuid,
      fileName: cleanFileName(file.originalname),
      contentType: fileType.mime,
      fileSize: file.size,
      attachment: file.buffer,
      caption: typeof req.body.caption === 'string' ? req.body.caption.slice(0, 500) : null,
      isInternal: false,
      createdBy: email,
      updatedBy: email
    } as Types.AttachmentInterface, { transaction }) as AttachmentRecord

    // Answering a More info request sends the offense back to staff for review
    if(offense.outcome === 'MORE_INFO') {
      await offense.update({ outcome: 'SUBMITTED', updatedBy: email }, { transaction })
    }

    return attachment
  })

  res.status(201).json({
    success: true,
    data: { uuid: created.uuid, offenseUuid: offense.uuid, fileName: created.fileName, fileSize: created.fileSize }
  })
})
