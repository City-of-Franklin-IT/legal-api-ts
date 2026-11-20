import path from 'path'
import request from './request'
import offense from './offense'
import attachment from './attachment'
import publicRoutes from './public'

// Types
import { Express, Router } from 'express'

export default (app: Express) => {
  const baseURL = `${ process.env.BASE_URL }/${ path.basename(__dirname) }`

  const setURL = (urlPath: string, router: Router) => {
    return app.use(`${ baseURL }${ urlPath }`, router)
  }

  setURL('/request', request)
  setURL('/offense', offense)
  setURL('/attachment', attachment)
  setURL('/public', publicRoutes)
}
