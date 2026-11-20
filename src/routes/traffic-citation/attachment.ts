import { Router } from "express"
import { downloadAttachment } from '@/controllers/traffic-citation/attachment'
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
  .route('/:uuid/download')
  .get(downloadAttachment)

export default router
