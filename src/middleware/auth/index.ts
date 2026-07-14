import asyncHandler from '../async'
import { ErrorResponse } from '../../utils/errorResponse'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'

// Types
import { Request, Response, NextFunction } from 'express'
import { EntraUserInterface } from "./types"

const jwks = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${ process.env.ENTRA_TENANT_ID }/discovery/v2.0/keys`,
  cache: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 600000
})

const getKey = (header: any, callback: any) => {
  try {
    if(header?.alg !== 'RS256') {
      return callback(new Error('Unsupported token algorithm'))
    }

    jwks.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(err)
      } else {
        const signingKey = key?.getPublicKey()
        callback(null, signingKey)
      }
    })
  } catch (err) {
    callback(err)
  }
}

export const entra = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const env = process.env.NODE_ENV

  if(env === 'development') {
    const today = new Date()
    const iat = Math.floor(today.getTime() / 1000)
    const exp = iat + (30 * 24 * 60 * 60)

    const entra: EntraUserInterface = {
      aud: '',
      exp,
      iat,
      iss: '',
      name: '',
      nbf: iat,
      nonce: '',
      oid: '',
      preferred_username: 'test.o365-3@franklintn.gov',
      rh: '',
      roles: ['task.sudo', 'task.admin', 'task.write'],
      sid: '',
      sub: '',
      tid: '',
      uti: '',
      ver: ''
    }

    req.entra = entra

    return next()
  }

  if(!req.headers.authorization?.startsWith('Bearer ')) {
    return next(new ErrorResponse('Authorization header required', 401))
  }

  const token = req.headers.authorization.slice('Bearer '.length)

  jwt.verify(token, getKey, {
    audience: process.env.ENTRA_CLIENT_ID,
    issuer: `https://login.microsoftonline.com/${ process.env.ENTRA_TENANT_ID }/v2.0`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if(err) {
      req.log?.warn({ err: { name: err.name, message: err.message } }, 'jwt verify failed')
      return next(new ErrorResponse('Not authorized to access this route', 401))
    }

    req.entra = decoded as EntraUserInterface

    return next()
  })
})
