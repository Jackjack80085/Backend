import express from 'express'
import cors from 'cors'
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
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500']
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (file://, curl, Postman) in dev
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })
)
app.use(requestLogger)

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/', routes)

app.use(notFound)
app.use(errorHandler)

export default app
