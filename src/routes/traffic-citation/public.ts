import { Router } from "express"
import { createRequest, verifyRequest, getMe, getCorrespondences, createCorrespondence, getAttachments, downloadAttachment, createAttachment } from '@/controllers/traffic-citation/public'
import { requesterToken } from "@/middleware/auth/requesterToken"
import rateLimiter from "@/middleware/rateLimiter"
import submissionLimiter from "@/middleware/rateLimiter/submission"
import { verifyIpLimiter, verifyRequestLimiter } from "@/middleware/rateLimiter/verify"
import upload from "@/middleware/upload"
import uuidParam from './uuidParam'

const router = Router()

router.param('uuid', uuidParam)

// Tier A, no token: create a request, or confirm email and phone to get a token
router
  .route('/request')
  .post(submissionLimiter, createRequest)

router
  .route('/request/:uuid/verify')
  .post(verifyIpLimiter, verifyRequestLimiter, verifyRequest)

// Tier B: everything below requires the short-lived requester token
router.use(requesterToken)
router.use(rateLimiter)

router
  .route('/me')
  .get(getMe)

router
  .route('/correspondence')
  .get(getCorrespondences)
  .post(createCorrespondence)

router
  .route('/offense/:uuid/attachment')
  .post(upload, createAttachment)

router
  .route('/attachment')
  .get(getAttachments)

router
  .route('/attachment/:uuid/download')
  .get(downloadAttachment)

export default router
