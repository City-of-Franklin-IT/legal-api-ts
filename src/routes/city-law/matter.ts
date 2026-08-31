import { Router } from "express"
import { getMatters, getMatter } from '@/controllers/city-law/matter'
import { entra } from "@/middleware/auth"
import rateLimiter from "@/middleware/rateLimiter"

const router = Router()

router.use(entra)
router.use(rateLimiter)

router
  .route('/')
  .get(getMatters)

router
  .route('/:matterId')
  .get(getMatter)

export default router