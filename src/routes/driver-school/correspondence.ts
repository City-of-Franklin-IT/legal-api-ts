import { Router } from "express"
import { getCorrespondences, getCorrespondence, createCorrespondence, updateCorrespondence, deleteCorrespondence } from '@/controllers/driver-school/correspondence'
import { entra } from "@/middleware/auth"
import rateLimiter from "@/middleware/rateLimiter"
import uuidParam from './uuidParam'

const router = Router()

router.use(entra)
router.use(rateLimiter)
router.param('uuid', uuidParam)

router
  .route('/')
  .get(getCorrespondences)
  .post(createCorrespondence)

router
  .route('/:uuid')
  .get(getCorrespondence)
  .put(updateCorrespondence)
  .delete(deleteCorrespondence)

export default router
