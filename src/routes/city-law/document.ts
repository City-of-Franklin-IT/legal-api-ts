import { Router } from "express"
import { getDocument, getDocumentsZip } from '@/controllers/city-law/document'
import { entra } from "@/middleware/auth"
import rateLimiter from "@/middleware/rateLimiter"

const router = Router()

router.use(entra)
router.use(rateLimiter)

router
  .route('/zip/:matterId')
  .get(getDocumentsZip)

router
  .route('/:docId')
  .get(getDocument)

export default router