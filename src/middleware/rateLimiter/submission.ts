import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

// Types
import { Request } from 'express'

export default rateLimit({ // Stricter limit for unauthenticated public submissions
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // limit each IP to 10 submissions per windowMs
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? ''),
  message: 'Too many submissions, please try again later.'
})
