import { Router } from "express"
import { getDocument, getDocumentsZip } from '@/controllers/city-law/document'
import { entra } from "@/middleware/auth"

const router = Router()

router.use(entra)

router
  .route('/zip/:matterId')
  .get(getDocumentsZip)

router
  .route('/:docId')
  .get(getDocument)

export default router