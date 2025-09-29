import express from 'express';
import mongoose from 'mongoose';
import config from '../config/config';
import { logInfo, logError } from '../utils/logger';

export class HealthService {
  async checkDatabase(): Promise<{ status: string; details: any }> {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      const dbStatus = states[state as keyof typeof states] || 'unknown';
      
      if (state === 1) {
        // Get database stats
        const stats = await mongoose.connection.db?.admin().ping();
        return {
          status: 'healthy',
          details: {
            connection: dbStatus,
            ping: stats?.ok === 1 ? 'success' : 'failed',
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name,
          },
        };
      } else {
        return {
          status: 'unhealthy',
          details: {
            connection: dbStatus,
            error: 'Database not connected',
          },
        };
      }
    } catch (error) {
      logError('Database health check failed', error);
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async checkMemory(): Promise<{ status: string; details: any }> {
    try {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const memUsagePercent = (usedMem / totalMem) * 100;

      return {
        status: memUsagePercent > 90 ? 'warning' : 'healthy',
        details: {
          heapUsed: `${Math.round(usedMem / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(totalMem / 1024 / 1024)} MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
          rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
          usagePercent: `${memUsagePercent.toFixed(2)}%`,
        },
      };
    } catch (error) {
      logError('Memory health check failed', error);
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async checkDisk(): Promise<{ status: string; details: any }> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Check uploads directory
      const uploadsDir = config.fileUpload.UPLOAD_PATH || 'uploads';
      const uploadsPath = path.resolve(uploadsDir);
      
      let uploadsExists = false;
      let uploadsSize = 0;
      
      try {
        const stats = fs.statSync(uploadsPath);
        uploadsExists = stats.isDirectory();
        
        // Calculate directory size (simplified)
        const files = fs.readdirSync(uploadsPath);
        uploadsSize = files.length;
      } catch (error) {
        // Directory doesn't exist or can't be accessed
      }

      return {
        status: 'healthy',
        details: {
          uploadsDirectory: uploadsExists ? 'exists' : 'missing',
          uploadsPath,
          fileCount: uploadsSize,
        },
      };
    } catch (error) {
      logError('Disk health check failed', error);
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async checkEnvironment(): Promise<{ status: string; details: any }> {
    try {
      const requiredEnvVars = [
        'NODE_ENV',
        'PORT',
        'MONGODB_URI',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
      ];

      const missingVars = requiredEnvVars.filter(varName => {
        switch(varName) {
          case 'NODE_ENV': return !config.common.NODE_ENV;
          case 'PORT': return !config.common.PORT;
          case 'MONGODB_URI': return !config.mongodb.URL;
          case 'JWT_SECRET': return !config.jwt.SECRET_KEY;
          case 'JWT_REFRESH_SECRET': return !config.jwt.REFRESH_SECRET;
          default: return !process.env[varName];
        }
      });
      
      return {
        status: missingVars.length > 0 ? 'warning' : 'healthy',
        details: {
          nodeEnv: config.common.NODE_ENV || 'not set',
          port: config.common.PORT || 'not set',
          missingVariables: missingVars,
          totalVariables: requiredEnvVars.length,
        },
      };
    } catch (error) {
      logError('Environment health check failed', error);
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async getOverallHealth(): Promise<any> {
    try {
      const [database, memory, disk, environment] = await Promise.all([
        this.checkDatabase(),
        this.checkMemory(),
        this.checkDisk(),
        this.checkEnvironment(),
      ]);

      const checks = {
        database,
        memory,
        disk,
        environment,
      };

      // Determine overall status
      const statuses = Object.values(checks).map((check: any) => check.status);
      let overallStatus = 'healthy';
      
      if (statuses.includes('unhealthy')) {
        overallStatus = 'unhealthy';
      } else if (statuses.includes('warning')) {
        overallStatus = 'warning';
      }

      const uptime = process.uptime();
      const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: uptimeFormatted,
        version: process.env.npm_package_version || '1.0.0',
        checks,
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid,
        },
      };
    } catch (error) {
      logError('Overall health check failed', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const healthService = new HealthService();

// Health check routes
export const setupHealthRoutes = (app: express.Application): void => {
  const router = express.Router();

  // Basic health check
  router.get('/', async (req, res) => {
    try {
      const health = await healthService.getOverallHealth();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'warning' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      logError('Health check endpoint error', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  });

  // Database health check
  router.get('/database', async (req, res) => {
    try {
      const dbHealth = await healthService.checkDatabase();
      const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json(dbHealth);
    } catch (error) {
      logError('Database health check endpoint error', error);
      res.status(503).json({
        status: 'unhealthy',
        error: 'Database health check failed',
      });
    }
  });

  // Memory health check
  router.get('/memory', async (req, res) => {
    try {
      const memHealth = await healthService.checkMemory();
      res.status(200).json(memHealth);
    } catch (error) {
      logError('Memory health check endpoint error', error);
      res.status(503).json({
        status: 'unhealthy',
        error: 'Memory health check failed',
      });
    }
  });

  // Ready check (for load balancers)
  router.get('/ready', async (req, res) => {
    try {
      const dbHealth = await healthService.checkDatabase();
      if (dbHealth.status === 'healthy') {
        res.status(200).json({ status: 'ready' });
      } else {
        res.status(503).json({ status: 'not ready' });
      }
    } catch (error) {
      res.status(503).json({ status: 'not ready' });
    }
  });

  // Live check (for load balancers)
  router.get('/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
  });

  app.use('/health', router);
  
  logInfo('Health check routes setup completed', {
    endpoints: ['/', '/database', '/memory', '/ready', '/live'],
  });
};
