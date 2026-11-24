import { randomUUID } from 'crypto'
import { Op } from 'sequelize'
import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import { signRequesterToken } from '@/utils/requesterToken'
import detectFileType from '@/utils/detectFileType'
import cleanFileName from '@/utils/cleanFileName'
import { sequelize, Requester, Offense, Approval, Attachment } from '@/models/traffic-citation'
import { sendAttachment } from './attachment'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import * as Types from '@/models/traffic-citation/types'

type RequesterRecord = Model<Types.RequesterInterface> & Types.RequesterInterface
type OffenseRecord = Model<Types.OffenseInterface> & Types.OffenseInterface
type AttachmentRecord = Model<Types.AttachmentInterface> & Types.AttachmentInterface

const OPEN_FOR_PROOF: Types.Outcome[] = ['SUBMITTED', 'MORE_INFO']

const visibleToRequester = (parentId: string) => ({
  parentId,
  isInternal: { [Op.or]: [false, null] }
})

const digits = (value: string) => value.replace(/\D/g, '')

const normalizePhone = (value: string) => {
  const d = digits(value)

  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d
}

type CreateBody = Types.RequesterCreateInterface & { offenses?: Types.OffenseType[] }

//@desc    Initial public submission. Creates the request and its offenses; returns a short-lived token and the offense uuids so proof can be uploaded.
//@route   POST /api/v2/legal/traffic-citation/public/request
//@access  Public (rate limited)
export const createRequest = asyncHandler(async (req: Request<{}, {}, CreateBody>, res: Response, next: NextFunction) => {
  const { requestType, firstName, lastName, email, phone, citationNumber, licenseNumber, licenseState, dob, offenses } = req.body

  if(!citationNumber && !(licenseNumber && licenseState && dob)) {
    return next(new ErrorResponse('A citation number, or a license number, state and date of birth, is required', 400))
  }

  const offenseTypes: Types.OffenseType[] = requestType === 'DRIVING_SCHOOL' ? ['DRIVING_SCHOOL'] : offenses!

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
export const verifyRequest = asyncHandler(async (req: Request<{ uuid: string }, {}, { email: string, phone: string }>, res: Response, next: NextFunction) => {
  const { email, phone } = req.body

  const requester = await Requester.findOne({ where: { uuid: req.params.uuid } }) as RequesterRecord | null

  const matches = !!requester &&
    requester.email.trim().toLowerCase() === email.trim().toLowerCase() &&
    normalizePhone(requester.phone) === normalizePhone(phone)

  if(!matches) {
    return next(new ErrorResponse('Those details do not match this request', 401))
  }

  res.status(200).json({ success: true, data: { token: signRequesterToken(requester!.uuid) } })
})

//@desc    The defendant's own request: offenses with outcomes, amounts, the More info note and files. No license, DOB, phone or staff identities.
//@route   GET /api/v2/legal/traffic-citation/public/me
//@access  Requester token
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const requester = req.requester!

  const [offenses, attachments] = await Promise.all([
    Offense.findAll({ where: { parentId: requester.uuid }, order: [['id', 'asc']] }) as Promise<OffenseRecord[]>,
    Attachment.findAll({ where: visibleToRequester(requester.uuid), order: [['createdAt', 'asc']] }) as Promise<AttachmentRecord[]>
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
      }))
    }
  })
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

  const latestDecision = await Approval.findOne({ 
    where: { parentId: offense.uuid }, 
    order: [['createdAt', 'desc']] }) as (Model<Types.ApprovalInterface> & Types.ApprovalInterface) | null

  const alreadySent = await Attachment.count({
    where: {
      offenseUuid: offense.uuid,
      isInternal: { [Op.or]: [false, null] }, // files the court sent never count against the defendant's one file
      ...(latestDecision && { createdAt: { [Op.gt]: latestDecision.createdAt } })
    }
  })

  if(alreadySent >= 1) {
    return next(new ErrorResponse('This offense already has a file. You can send another only if the court asks for more information.', 409))
  }

  const email = requester.email.toLowerCase()

  const fileType = detectFileType(file.buffer)!

  const created = await sequelize.transaction(async (transaction) => {
    const attachment = await Attachment.create({
      parentId: requester.uuid,
      offenseUuid: offense.uuid,
      fileName: cleanFileName(file.originalname, 'proof'),
      contentType: fileType.mime,
      fileSize: file.size,
      attachment: file.buffer,
      caption: req.body.caption ?? null,
      isInternal: false,
      createdBy: email,
      updatedBy: email
    } as Types.AttachmentInterface, { transaction }) as AttachmentRecord

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
