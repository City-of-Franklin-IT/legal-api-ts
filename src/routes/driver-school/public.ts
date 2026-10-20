import { Router } from "express"
import { submitRequester, getMe, getCorrespondences, createCorrespondence, getAttachments, downloadAttachment, createAttachment } from '@/controllers/driver-school/public'
import { requesterToken } from "@/middleware/auth/requesterToken"
import rateLimiter from "@/middleware/rateLimiter"
import submissionLimiter from "@/middleware/rateLimiter/submission"
import upload from "@/middleware/upload"
import uuidParam from './uuidParam'

const router = Router()

router.param('uuid', uuidParam)

// Unauthenticated initial submission
router
  .route('/requester')
  .post(submissionLimiter, submitRequester)

// Everything below requires the emailed requester token
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
  .route('/attachment')
  .get(getAttachments)
  .post(upload, createAttachment)

router
  .route('/attachment/:uuid/download')
  .get(downloadAttachment)

export default router
