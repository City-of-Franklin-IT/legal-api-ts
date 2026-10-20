import { Router } from "express"
import { getRequesters, getRequester, createRequester, updateRequester, deleteRequester, createRequesterToken } from '@/controllers/driver-school/requester'
import { entra } from "@/middleware/auth"
import rateLimiter from "@/middleware/rateLimiter"
import uuidParam from './uuidParam'

const router = Router()

router.use(entra)
router.use(rateLimiter)
router.param('uuid', uuidParam)

router
  .route('/')
  .get(getRequesters)
  .post(createRequester)

router
  .route('/:uuid')
  .get(getRequester)
  .put(updateRequester)
  .delete(deleteRequester)

router
  .route('/:uuid/token')
  .post(createRequesterToken)

export default router
