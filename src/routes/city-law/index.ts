import path from 'path'
import matter from './matter'
import document from './document'
import makeDocsRoute from '../makeDocsRoute'

// Types
import { Express, Router } from 'express'

const docsRoutes = makeDocsRoute('city-law')

export default (app: Express) => {
  const baseURL = `${ process.env.BASE_URL }/${ path.basename(__dirname) }`

  const setURL = (urlPath: string, router: Router) => {
    return app.use(`${ baseURL }${ urlPath }`, router)
  }

  setURL('/matter', matter)
  setURL('/document', document)
  setURL('/docs', docsRoutes)
}