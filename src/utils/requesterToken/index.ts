import jwt from 'jsonwebtoken'
import { ErrorResponse } from '../errorResponse'

const SCOPE = 'driver-school-requester'

const getSecret = () => {
  const secret = process.env.DRIVER_SCHOOL_TOKEN_SECRET

  if(!secret) {
    throw new ErrorResponse('Requester token secret is not configured', 500)
  }

  return secret
}

//@desc    Sign a stateless token that lets a requester submit back to their own request
export const signRequesterToken = (requesterUuid: string) => {
  return jwt.sign({ scope: SCOPE }, getSecret(), {
    subject: requesterUuid,
    algorithm: 'HS256',
    expiresIn: (process.env.DRIVER_SCHOOL_TOKEN_TTL || '14d') as jwt.SignOptions['expiresIn']
  })
}

//@desc    Verify a requester token, returning the requester uuid or null when invalid/expired
export const verifyRequesterToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, getSecret(), { algorithms: ['HS256'] })

    if(typeof decoded === 'string' || decoded.scope !== SCOPE || !decoded.sub) {
      return null
    }

    return decoded.sub
  } catch(err) {
    if(err instanceof ErrorResponse) {
      throw err
    }

    return null
  }
}
