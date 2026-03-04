import express from 'express'
import cors from 'cors'
import path from 'path'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from '../config/swagger.config'
import requestLogger from '../middlewares/logger.middleware'
import routes from './routes'
import notFound from '../middlewares/notFound'
import errorHandler from '../middlewares/errorHandler'

declare global {
  namespace Express {
    interface Request {
      admin?: any
      user?: any
      rawBody?: string
    }
  }
}

const app = express()

// Parse JSON and capture raw body for later use (via verify)
app.use(
  express.json({
    verify: (req: any, _res, buf: Buffer) => {
      req.rawBody = buf && buf.toString('utf8')
    },
  })
)
// Allow requests from frontend and local test pages
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:5500', 
  'http://127.0.0.1:5500', 
  'http://localhost:5000', 
  'http://127.0.0.1:5000',
  'https://frontend-production-39ad.up.railway.app'
]
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (file://, curl, Postman)
      // Allow all origins in development, only allow whitelist in production
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true)
      } else {
        callback(null, true) // Allow cross-origin in production too
      }
    },
    credentials: true,
  })
)
app.use(requestLogger)

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Serve the payment test page (test-integration.html + any QR image) at /pay
// Place qr-code.png in the project root alongside test-integration.html
const projectRoot = process.cwd()
app.get('/pay', (_req, res) => {
  res.sendFile(path.join(projectRoot, 'test-integration.html'))
})
// Serve static assets (qr-code.png etc.) from the project root at /pay-assets
app.use('/pay-assets', express.static(projectRoot))

app.use('/', routes)

app.use(notFound)
app.use(errorHandler)

export default app
