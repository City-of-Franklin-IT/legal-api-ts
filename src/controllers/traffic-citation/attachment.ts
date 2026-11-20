import asyncHandler from '@/middleware/async'
import { ErrorResponse } from '@/utils/errorResponse'
import { Attachment } from '@/models/traffic-citation'

// Types
import { Request, Response, NextFunction } from 'express'
import { Model } from 'sequelize'
import * as Types from '@/models/traffic-citation/types'

type AttachmentRecord = Model<Types.AttachmentInterface> & Types.AttachmentInterface

// Only these are ever served inline; anything else is forced to download
const INLINE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export const sendAttachment = (res: Response, attachment: AttachmentRecord) => {
  const inline = INLINE_TYPES.includes(attachment.contentType)

  res.setHeader('Content-Type', inline ? attachment.contentType : 'application/octet-stream')
  res.setHeader('Content-Length', attachment.attachment.length.toString())
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Content-Disposition', `${ inline ? 'inline' : 'attachment' }; filename*=UTF-8''${ encodeURIComponent(attachment.fileName) }`)
  res.status(200).send(attachment.attachment)
}

//@desc    Download attachment file
//@route   GET /api/v2/legal/traffic-citation/attachment/:uuid/download
//@access  citation.admin
export const downloadAttachment = asyncHandler(async (req: Request<{ uuid: string }>, res: Response, next: NextFunction) => {
  const attachment = await Attachment.unscoped().findOne({ where: { uuid: req.params.uuid } }) as AttachmentRecord | null

  if(!attachment) {
    return next(new ErrorResponse(`Unable to return attachment by uuid ${ req.params.uuid }`, 404))
  }

  sendAttachment(res, attachment)
})
