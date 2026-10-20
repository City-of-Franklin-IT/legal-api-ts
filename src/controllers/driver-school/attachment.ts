import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import editorTracking from '@/utils/editorTracking'
import isUuid from '@/utils/isUuid'
import detectFileType from '@/utils/detectFileType'
import { Requester, Attachment } from '@/models/driver-school'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import { ControllerResponse } from '@/controllers/types'
import * as Types from '@/models/driver-school/types'

type AttachmentRecord = Model<Types.AttachmentInterface> & Types.AttachmentInterface

// multipart fields arrive as strings
export const toBoolean = (value: unknown) => value === true || value === 'true'

export const sendAttachment = (res: Response, attachment: AttachmentRecord) => {
  // Type comes from the stored bytes themselves; uploads are validated, so null is only a legacy/foreign row
  const fileType = detectFileType(attachment.attachment)

  res.setHeader('Content-Type', fileType?.mime ?? 'application/octet-stream')
  res.setHeader('Content-Length', attachment.attachment.length.toString())
  res.setHeader('Content-Disposition', `${ fileType ? 'inline' : 'attachment' }; filename="attachment-${ attachment.uuid }${ fileType ? `.${ fileType.ext }` : '' }"`)
  res.status(200).send(attachment.attachment)
}

//@desc    Get attachments (without file contents) by requester uuid
//@route   GET /api/v1/legal/driver-school/attachment?parentId=
//@access  Private
export const getAttachments = asyncHandler(async (req: Request<{}, {}, {}, { parentId?: string }>, res: Response<ControllerResponse & { data: Types.AttachmentInterface[] }>, next: NextFunction) => {
  if(!isUuid(req.query.parentId)) {
    return next(new ErrorResponse('A valid parentId is required', 400))
  }

  const attachments = await Attachment.findAll({
    where: { parentId: req.query.parentId },
    order: [['createdAt', 'asc']]
  }) as AttachmentRecord[]

  res.status(200).json({
    success: true,
    data: attachments
  })
})

//@desc    Get attachment metadata by uuid
//@route   GET /api/v1/legal/driver-school/attachment/:uuid
//@access  Private
export const getAttachment = asyncHandler(async (req: Request<{ uuid: string }>, res: Response<ControllerResponse & { data: Types.AttachmentInterface }>, next: NextFunction) => {
  const attachment = await Attachment.findOne({ where: { uuid: req.params.uuid } }) as AttachmentRecord | null

  if(!attachment) {
    return next(new ErrorResponse(`Unable to return attachment by uuid ${ req.params.uuid }`, 404))
  }

  res.status(200).json({
    success: true,
    data: attachment
  })
})

//@desc    Download attachment file
//@route   GET /api/v1/legal/driver-school/attachment/:uuid/download
//@access  Private
export const downloadAttachment = asyncHandler(async (req: Request<{ uuid: string }>, res: Response, next: NextFunction) => {
  const attachment = await Attachment.unscoped().findOne({ where: { uuid: req.params.uuid } }) as AttachmentRecord | null

  if(!attachment) {
    return next(new ErrorResponse(`Unable to return attachment by uuid ${ req.params.uuid }`, 404))
  }

  sendAttachment(res, attachment)
})

//@desc    Create attachment (multipart: file field "attachment", plus parentId, caption, isInternal)
//@route   POST /api/v1/legal/driver-school/attachment
//@access  Private
export const createAttachment = asyncHandler(async (req: Request<{}, {}, { parentId: string, caption?: string, isInternal?: string }>, res: Response<ControllerResponse & { data: Types.AttachmentInterface }>, next: NextFunction) => {
  if(!isUuid(req.body.parentId) || !await Requester.findOne({ where: { uuid: req.body.parentId } })) {
    return next(new ErrorResponse(`Unable to find requester by parentId ${ req.body.parentId }`, 404))
  }

  const file = req.file!

  const created = await Attachment.create({
    parentId: req.body.parentId,
    attachment: file.buffer,
    caption: req.body.caption,
    isInternal: toBoolean(req.body.isInternal),
    ...editorTracking(req)
  } as Types.AttachmentInterface)

  // Re-read through the default scope so the binary isn't echoed back
  const attachment = await Attachment.findOne({ where: { uuid: (created as AttachmentRecord).uuid } }) as AttachmentRecord

  res.status(201).json({
    success: true,
    data: attachment
  })
})

//@desc    Update attachment metadata (caption, isInternal)
//@route   PUT /api/v1/legal/driver-school/attachment/:uuid
//@access  Private
export const updateAttachment = asyncHandler(async (req: Request<{ uuid: string }, {}, { caption?: string, isInternal?: boolean }>, res: Response<ControllerResponse & { data: Types.AttachmentInterface }>, next: NextFunction) => {
  const attachment = await Attachment.findOne({ where: { uuid: req.params.uuid } }) as AttachmentRecord | null

  if(!attachment) {
    return next(new ErrorResponse(`Unable to update attachment by uuid ${ req.params.uuid }`, 404))
  }

  const { caption, isInternal } = req.body ?? {}

  // Only apply fields that were sent
  const updates = Object.fromEntries(Object.entries({ caption, isInternal }).filter(([, value]) => value !== undefined))

  await attachment.update({ ...updates, ...editorTracking(req) })

  res.status(200).json({
    success: true,
    data: attachment
  })
})

//@desc    Delete attachment
//@route   DELETE /api/v1/legal/driver-school/attachment/:uuid
//@access  Private
export const deleteAttachment = asyncHandler(async (req: Request<{ uuid: string }>, res: Response<ControllerResponse>, next: NextFunction) => {
  const attachment = await Attachment.findOne({ where: { uuid: req.params.uuid } }) as AttachmentRecord | null

  if(!attachment) {
    return next(new ErrorResponse(`Unable to delete attachment by uuid ${ req.params.uuid }`, 404))
  }

  await attachment.destroy()

  res.status(200).json({
    success: true
  })
})
