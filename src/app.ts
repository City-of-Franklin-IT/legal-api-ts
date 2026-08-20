import dotenv from 'dotenv'
import path from 'path'

// Resolve paths from project root using cwd
const projectRoot = process.cwd()
const envPath = path.join(projectRoot, '.env')
const envFilePath = path.join(projectRoot, `.env.${ process.env.NODE_ENV || "development" }`)

// Load shared credentials and base config first
dotenv.config({ path: envPath })

// Load environment-specific config second (overrides shared if needed)
dotenv.config({ path: envFilePath, override: true })

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