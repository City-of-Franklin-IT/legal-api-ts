import { Router } from "express"
import { getMatters, getMatter } from '@/controllers/city-law/matter'
import { entra } from "@/middleware/auth"

const router = Router()

router.use(entra)

router
  .route('/')
  .get(getMatters)

router
  .route('/:matterId')
  .get(getMatter)

export default router