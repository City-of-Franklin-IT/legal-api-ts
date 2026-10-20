import { ErrorResponse } from '../../utils/errorResponse'

// Types
import { Response, Request, NextFunction } from 'express'
import { ValidationError } from 'sequelize'
import { ErrorWithStatus, SequelizeErrorWithStatus } from './types'

export default (err: ErrorWithStatus | SequelizeErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err }

  if(err.name === 'SequelizeValidationError') {
    const validationError = err as unknown as ValidationError
    error.message = validationError.errors[0].message
    error = new ErrorResponse(error.message, 500)
  } else if(err.name === 'SequelizeUniqueConstraintError') {
    error = new ErrorResponse('A record with these values already exists', 409)
  } else if(err.name === 'MulterError') {
    error = new ErrorResponse(err.message, (err as { code?: string }).code === 'LIMIT_FILE_SIZE' ? 413 : 400)
  } else {
    error = new ErrorResponse(err.message, err.statusCode || 500)
  }

  req.log?.error({ err }, error.message || 'Server Error')

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  })
}