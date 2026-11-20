import { ErrorResponse } from '../errorResponse'

// Types
import { Request, Response, NextFunction } from 'express'

//@desc    Allows the request only when the Entra token carries one of the given roles; use after `entra`
export const requireRole = (...allowed: string[]) => (req: Request, _res: Response, next: NextFunction) => {
  const roles = req.entra?.roles ?? []

  if(!allowed.some(role => roles.includes(role))) {
    return next(new ErrorResponse('Insufficient role to access this route', 403))
  }

  return next()
}
