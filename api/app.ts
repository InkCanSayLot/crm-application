/**
 * This is a API server
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import authRoutes from './routes/auth'
import crmRoutes from './routes/crm'
import calendarRoutes from './routes/calendar'
import journalRoutes from './routes/journal'
import financialRoutes from './routes/financial'
import reportsRoutes from './routes/reports'
import analyticsRoutes from './routes/analytics'

// For Vercel serverless deployment, we don't need __dirname

const app: express.Application = express()

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests from Vercel domains and configured origins
        const allowedOrigins = [
          ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
          ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [])
        ];
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Allow Vercel preview and production domains
        if (origin.includes('.vercel.app') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      }
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/crm', crmRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/journal', journalRoutes)
app.use('/api/financial', financialRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/analytics', analyticsRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * Handle API 404s - Vercel handles static files separately
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
  })
})

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})



export { app }
export default app
