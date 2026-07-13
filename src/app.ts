import dotenv from 'dotenv'
dotenv.config({ path: 'src/config/config.env' })

import express from 'express'
import hpp from 'hpp'
import helmet from 'helmet'
import cors from 'cors'
import pinoHttp from 'pino-http'
import errorHandler from './middleware/errorHandler'
import csp from './middleware/csp'
import inputSanitation from './middleware/inputSanitation'
import logger from './utils/logger'

const app = express()

app.use(pinoHttp({ logger }))
app.use(express.json()) // Request body parser
app.use(helmet())
app.use(hpp())
app.use(csp) // Content security policy
app.use(inputSanitation) // Input sanitation
app.use(cors({ origin: ['https://dev.franklintn.gov', 'https://apps.franklintn.gov', 'http://cofasv38', 'https://istest.franklintn.gov'] })) // CORS

// Route files
import cityLawRoutes from '@/routes/city-law'

// Mount routes
cityLawRoutes(app)

app.use(errorHandler)

const port = process.env.PORT

app.set('port', port)

app.listen({ port }, async () => {
  logger.info(`Server up on ${ process.env.HOST }:${ port } in ${ process.env.NODE_ENV } mode..`)
})