import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import config from './config/config.js';
import connectDB from './config/database.js';
import routes from './routes/index.js';
import { globalErrorHandler } from './utils/responseHandler.js';
import { corsMiddleware, requestLogger, securityHeaders } from './middleware/validation.js';
import { morganStream, errorLogger } from './utils/logger.js';
import { setupHealthRoutes } from './services/healthService.js';

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(securityHeaders);

// CORS middleware
app.use(corsMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(config.rateLimit.WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(config.rateLimit.MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Morgan HTTP request logging
app.use(morgan('combined', { stream: morganStream }));

// API routes
app.use('/api/v1', routes);

// Swagger documentation
// setupSwagger(app);

// Health check routes
setupHealthRoutes(app);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bus Express API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: '/api/v1/health',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// Error logging middleware
app.use(errorLogger);

// Global error handler
app.use(globalErrorHandler);

const PORT = config.common.PORT || 5005;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${config.common.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.log('Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.log('Uncaught Exception:', err.message);
  process.exit(1);
});

export default app;
