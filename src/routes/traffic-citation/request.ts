import { Router } from "express"
import { getRequests, getRequest, setDueDate } from '@/controllers/traffic-citation/requester'
import { createNotification } from '@/controllers/traffic-citation/notification'
import { entra } from "@/middleware/auth"
import { requireRole } from "@/utils/requireRole"
import rateLimiter from "@/middleware/rateLimiter"

const router = Router()

router.use(entra)
router.use(requireRole('citation.admin'))
router.use(rateLimiter)

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
  .route('/:uuid/notification')
  .post(createNotification)

export default router
