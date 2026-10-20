import { Router } from "express"
import { getApprovals, getApproval, createApproval, updateApproval, deleteApproval } from '@/controllers/driver-school/approval'
import { entra } from "@/middleware/auth"
import rateLimiter from "@/middleware/rateLimiter"
import uuidParam from './uuidParam'

const router = Router()

router.use(entra)
router.use(rateLimiter)
router.param('uuid', uuidParam)

router
  .route('/')
  .get(getApprovals)
  .post(createApproval)

router
  .route('/:uuid')
  .get(getApproval)
  .put(updateApproval)
  .delete(deleteApproval)

export default router
