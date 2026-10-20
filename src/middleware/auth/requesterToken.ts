import asyncHandler from '../async'
import { ErrorResponse } from '../../utils/errorResponse'
import { verifyRequesterToken } from '../../utils/requesterToken'
import { Requester } from '../../models/driver-school'

// Types
import { Request, Response, NextFunction } from 'express'
import * as Types from '../../models/driver-school/types'

//@desc    Authenticates a requester by the token emailed to them; sets req.requester
export const requesterToken = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if(!req.headers.authorization?.startsWith('Bearer ')) {
    return next(new ErrorResponse('Authorization header required', 401))
  }

  const uuid = verifyRequesterToken(req.headers.authorization.slice('Bearer '.length))

  const requester = uuid ?
    await Requester.findOne({ where: { uuid } }) as Types.RequesterInterface | null :
    null

  if(!requester) {
    return next(new ErrorResponse('Not authorized to access this route', 401))
  }

  req.requester = requester

  return next()
})
