import { Router } from "express"
import { createDecision } from '@/controllers/traffic-citation/offense'
import { entra } from "@/middleware/auth"
import { requireRole } from "@/utils/requireRole"
import rateLimiter from "@/middleware/rateLimiter"
import { optionalUpload } from "@/middleware/upload"

const router = Router()

router.use(entra)
router.use(requireRole('citation.admin'))
router.use(rateLimiter)

router
  .route('/:uuid/decision')
  .post(optionalUpload, createDecision)

export default router
