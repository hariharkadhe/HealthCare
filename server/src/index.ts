import dotenv from 'dotenv';
import { app } from './app';
import { connectDB, disconnectDB } from './config/database';
import { seedDatabase } from './seeds/seed';
import { logger } from './utils/logger';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to database (with embedded fallback if no local/remote mongod)
    await connectDB();

    // Auto-seed if empty database
    await seedDatabase(false);

    const server = app.listen(PORT, () => {
      logger.info(`Medicare Pro Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`Health check available at http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown handling
    const shutdown = async () => {
      logger.info('Shutting down Medicare Pro server...');
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
