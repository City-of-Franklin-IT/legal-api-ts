import { Router } from "express"
import { getRequests, getRequest, setDueDate } from '@/controllers/traffic-citation/requester'
import { createCorrespondence } from '@/controllers/traffic-citation/correspondence'
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
  .route('/')
  .get(getRequests)

router
  .route('/:uuid')
  .get(getRequest)

router
  .route('/:uuid/due-date')
  .put(setDueDate)

router
  .route('/:uuid/correspondence')
  .post(createCorrespondence)

export default router
