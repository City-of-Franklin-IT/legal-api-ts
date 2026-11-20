import multer from 'multer'
import inputSanitation from '../inputSanitation'
import detectFileType from '../../utils/detectFileType'
import { ErrorResponse } from '../../utils/errorResponse'

// Types
import { Request, Response, NextFunction } from 'express'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.TRAFFIC_CITATION_MAX_UPLOAD_BYTES) || 10 * 1024 * 1024, files: 1 }
}).single('attachment')

// The client-supplied mime type is ignored; only the file's own bytes decide whether it is allowed
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']

const verifyFileType = (req: Request, _res: Response, next: NextFunction) => {
  if(!req.file) {
    return next(new ErrorResponse('An attachment file is required', 400))
  }

  const fileType = detectFileType(req.file.buffer)

  if(!fileType || !ALLOWED_MIMES.includes(fileType.mime)) {
    return next(new ErrorResponse('Only PDF, JPG, PNG and HEIC/HEIF files are allowed', 400))
  }

  next()
}

// multer builds req.body with a null prototype, which the global sanitizer can't handle
const normalizeBody = (req: Request, _res: Response, next: NextFunction) => {
  req.body = { ...req.body }
  next()
}

// For endpoints that take JSON or multipart: a file is optional, but when there is one it is checked the same way
const verifyFileTypeIfPresent = (req: Request, res: Response, next: NextFunction) => {
  if(!req.file) return next()

  verifyFileType(req, res, next)
}

// multipart text fields bypass the global JSON sanitizer, so it is re-applied after multer parses them
export const optionalUpload = [upload, normalizeBody, inputSanitation, verifyFileTypeIfPresent]

export default [upload, normalizeBody, inputSanitation, verifyFileType]
