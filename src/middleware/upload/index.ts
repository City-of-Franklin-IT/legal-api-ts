import multer from 'multer'
import inputSanitation from '../inputSanitation'
import detectFileType from '../../utils/detectFileType'
import { ErrorResponse } from '../../utils/errorResponse'

// Types
import { Request, Response, NextFunction } from 'express'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.DRIVER_SCHOOL_MAX_UPLOAD_BYTES) || 10 * 1024 * 1024, files: 1 }
}).single('attachment')

// The client-supplied mime type is ignored; only the file's own bytes decide whether it is allowed
const verifyFileType = (req: Request, _res: Response, next: NextFunction) => {
  if(!req.file) {
    return next(new ErrorResponse('An attachment file is required', 400))
  }

  if(!detectFileType(req.file.buffer)) {
    return next(new ErrorResponse('Only PDF and image files (JPEG, PNG, GIF, WebP) are allowed', 400))
  }

  next()
}

// multer builds req.body with a null prototype, which the global sanitizer can't handle
const normalizeBody = (req: Request, _res: Response, next: NextFunction) => {
  req.body = { ...req.body }
  next()
}

// multipart text fields bypass the global JSON sanitizer, so it is re-applied after multer parses them
export default [upload, normalizeBody, inputSanitation, verifyFileType]
