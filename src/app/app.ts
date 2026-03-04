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
  'https://frontend-production-39ad.up.railway.app',
]

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true)
    } else {
      callback(new Error(`CORS blocked: ${origin}`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

// Handle OPTIONS preflight BEFORE any other middleware or routes
app.options('*', cors(corsOptions))
app.use(cors(corsOptions))
app.use(errorHandler)

export default app
