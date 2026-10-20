import isUuid from '@/utils/isUuid'
import { ErrorResponse } from '@/utils/errorResponse'

// Types
import { Request, Response, NextFunction } from 'express'

// Rejects a malformed :uuid before it reaches SQL Server as an invalid uniqueidentifier
export default (_req: Request, _res: Response, next: NextFunction, value: string) => {
  if(!isUuid(value)) {
    return next(new ErrorResponse('Invalid uuid', 400))
  }

  next()
}
