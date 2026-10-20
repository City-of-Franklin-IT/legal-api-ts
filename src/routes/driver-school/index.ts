import path from 'path'
import requester from './requester'
import correspondence from './correspondence'
import approval from './approval'
import attachment from './attachment'
import publicRoutes from './public'

// Types
import { Express, Router } from 'express'

export default (app: Express) => {
  const baseURL = `${ process.env.BASE_URL }/${ path.basename(__dirname) }`

  const setURL = (urlPath: string, router: Router) => {
    return app.use(`${ baseURL }${ urlPath }`, router)
  }

  setURL('/requester', requester)
  setURL('/correspondence', correspondence)
  setURL('/approval', approval)
  setURL('/attachment', attachment)
  setURL('/public', publicRoutes)
}
