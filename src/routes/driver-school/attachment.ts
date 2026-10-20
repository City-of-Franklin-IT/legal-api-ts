import { Router } from "express"
import { getAttachments, getAttachment, downloadAttachment, createAttachment, updateAttachment, deleteAttachment } from '@/controllers/driver-school/attachment'
import { entra } from "@/middleware/auth"
import rateLimiter from "@/middleware/rateLimiter"
import upload from "@/middleware/upload"
import uuidParam from './uuidParam'

const router = Router()

router.use(entra)
router.use(rateLimiter)
router.param('uuid', uuidParam)

router
  .route('/')
  .get(getAttachments)
  .post(upload, createAttachment)

router
  .route('/:uuid')
  .get(getAttachment)
  .put(updateAttachment)
  .delete(deleteAttachment)

router
  .route('/:uuid/download')
  .get(downloadAttachment)

export default router
