import { Op } from 'sequelize'
import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import { signRequesterToken } from '@/utils/requesterToken'
import { Requester, Correspondence, Attachment } from '@/models/driver-school'
import { sendAttachment } from './attachment'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import { ControllerResponse } from '@/controllers/types'
import * as Types from '@/models/driver-school/types'

type RequesterRecord = Model<Types.RequesterInterface> & Types.RequesterInterface
type CorrespondenceRecord = Model<Types.CorrespondenceInterface> & Types.CorrespondenceInterface
type AttachmentRecord = Model<Types.AttachmentInterface> & Types.AttachmentInterface

// Requesters never see internal attachments
const visibleToRequester = (parentId: string) => ({
  parentId,
  isInternal: { [Op.or]: [false, null] }
})

//@desc    Initial public submission; returns a token so the requester can keep submitting
//@route   POST /api/v1/legal/driver-school/public/requester
//@access  Public (rate limited)
export const submitRequester = asyncHandler(async (req: Request<{}, {}, Types.RequesterCreateInterface>, res: Response<ControllerResponse & { data: { requester: Types.RequesterInterface, token: string } }>) => {
  const { citationNumber, firstName, lastName, email, licenseNumber, licenseState } = req.body ?? {}

  const requester = await Requester.create({ citationNumber, firstName, lastName, email, licenseNumber, licenseState } as Types.RequesterInterface) as RequesterRecord

  res.status(201).json({
    success: true,
    data: {
      requester,
      token: signRequesterToken(requester.uuid)
    }
  })
})

//@desc    Get the requester the token belongs to
//@route   GET /api/v1/legal/driver-school/public/me
//@access  Requester token
export const getMe = asyncHandler(async (req: Request, res: Response<ControllerResponse & { data: Types.RequesterInterface }>) => {
  res.status(200).json({
    success: true,
    data: req.requester!
  })
})

//@desc    Get the requester's correspondence
//@route   GET /api/v1/legal/driver-school/public/correspondence
//@access  Requester token
export const getCorrespondences = asyncHandler(async (req: Request, res: Response<ControllerResponse & { data: Types.CorrespondenceInterface[] }>) => {
  const correspondences = await Correspondence.findAll({
    where: { parentId: req.requester!.uuid },
    order: [['createdAt', 'asc']]
  }) as CorrespondenceRecord[]

  res.status(200).json({
    success: true,
    data: correspondences
  })
})

//@desc    Add correspondence to the requester's request
//@route   POST /api/v1/legal/driver-school/public/correspondence
//@access  Requester token
export const createCorrespondence = asyncHandler(async (req: Request<{}, {}, { message: string }>, res: Response<ControllerResponse & { data: Types.CorrespondenceInterface }>) => {
  const correspondence = await Correspondence.create({
    parentId: req.requester!.uuid,
    message: req.body.message,
    createdBy: req.requester!.email.toLowerCase()
  } as Types.CorrespondenceInterface) as CorrespondenceRecord

  res.status(201).json({
    success: true,
    data: correspondence
  })
})

//@desc    Get the requester's non-internal attachments (without file contents)
//@route   GET /api/v1/legal/driver-school/public/attachment
//@access  Requester token
export const getAttachments = asyncHandler(async (req: Request, res: Response<ControllerResponse & { data: Types.AttachmentInterface[] }>) => {
  const attachments = await Attachment.findAll({
    where: visibleToRequester(req.requester!.uuid),
    order: [['createdAt', 'asc']]
  }) as AttachmentRecord[]

  res.status(200).json({
    success: true,
    data: attachments
  })
})

//@desc    Download one of the requester's non-internal attachments
//@route   GET /api/v1/legal/driver-school/public/attachment/:uuid/download
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

//@desc    Upload an attachment to the requester's request (multipart: file field "attachment", plus caption)
//@route   POST /api/v1/legal/driver-school/public/attachment
//@access  Requester token
export const createAttachment = asyncHandler(async (req: Request<{}, {}, { caption?: string }>, res: Response<ControllerResponse & { data: Types.AttachmentInterface }>) => {
  const file = req.file!
  const email = req.requester!.email.toLowerCase()

  const created = await Attachment.create({
    parentId: req.requester!.uuid,
    attachment: file.buffer,
    caption: req.body.caption,
    isInternal: false,
    createdBy: email,
    updatedBy: email
  } as Types.AttachmentInterface)

  // Re-read through the default scope so the binary isn't echoed back
  const attachment = await Attachment.findOne({ where: { uuid: (created as AttachmentRecord).uuid } }) as AttachmentRecord

  res.status(201).json({
    success: true,
    data: attachment
  })
})
