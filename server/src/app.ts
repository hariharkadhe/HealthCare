import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorHandler, AppError } from './utils/errors';
import { generalLimiter } from './middleware/rateLimiter';

dotenv.config();

export const app: Application = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin like curl or mobile
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly permissive origin
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body and Cookie parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// General rate limiter
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'Medicare Pro Hospital Management API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount Main API Routes
app.use('/api', apiRoutes);

// Catch 404 routes
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
});

// Centralized error handler
app.use(errorHandler);
