// Types
import { Request } from "express"

export default (req: Request) => {
  const method = req.method

  const email = String(req.entra?.preferred_username.toLowerCase())

  return method === 'POST' ? 
    { createdBy: email, updatedBy: email } : 
    { updatedBy: email }
}