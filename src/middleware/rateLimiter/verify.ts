import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

// Types
import { Request } from 'express'

// Lockout counts are still open with the court (SPEC F16); these are placeholders
const WINDOW_MS = 15 * 60 * 1000

// Per IP across all requests
export const verifyIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 20,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? ''),
  message: { success: false, error: 'Too many attempts, please try again later or call the court.' }
})

// Per request uuid from any IP, so guessing one request's email/phone can't be spread across addresses
export const verifyRequestLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 5,
  keyGenerator: (req: Request) => `verify:${ req.params.uuid }`,
  message: { success: false, error: 'Too many attempts, please try again later or call the court.' }
})
