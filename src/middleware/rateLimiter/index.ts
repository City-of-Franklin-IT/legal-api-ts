import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

// Types
import { Request } from 'express'

export default rateLimit({ // Rate limiting
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: (req: Request) => req.entra?.oid || ipKeyGenerator(req.ip ?? ''),
  message: 'Too many requests, please try again later.'
})
