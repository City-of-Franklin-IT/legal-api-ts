import { Router } from "express"
import { createDecision } from '@/controllers/traffic-citation/offense'
import { entra } from "@/middleware/auth"
import { requireRole } from "@/utils/requireRole"
import rateLimiter from "@/middleware/rateLimiter"
import uuidParam from './uuidParam'

const router = Router()

router.use(entra)
router.use(requireRole('citation.admin'))
router.use(rateLimiter)
router.param('uuid', uuidParam)

router
  .route('/:uuid/decision')
  .post(createDecision)

export default router
