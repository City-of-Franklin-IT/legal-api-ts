// Types
import { EntraUserInterface } from '../../middleware/auth/types'
import { RequesterInterface } from '../../models/driver-school/types'

declare global {
  namespace Express {
    interface Request {
      entra?: EntraUserInterface
      requester?: RequesterInterface
    }
  }
}

export {}
