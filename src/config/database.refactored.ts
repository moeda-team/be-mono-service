import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/common/logger';
import { AppError, ErrorCode } from '../utils/errors/custom.errors';

class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private isConnected = false;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['info', 'warn', 'error'],
      errorFormat: 'pretty',
    });

    this.setupEventListeners();
    this.setupGracefulShutdown();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public get client(): PrismaClient {
    if (!this.isConnected) {
      throw AppError.serviceUnavailable('Database connection not established');
    }
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      logger.info('Database connected successfully');

      // Test the connection
      await this.prisma.$queryRaw`SELECT 1`;
      logger.info('Database connection test passed');
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to database:', error);
      throw AppError.serviceUnavailable('Database connection failed');
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  private setupEventListeners(): void {
    // Note: Prisma event listeners are typed as 'never' in current version
    // This is a known TypeScript limitation with Prisma types
    // The events work correctly at runtime despite the type errors

    (this.prisma as any).$on('query', (e: any) => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Database query:', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        });
      }
    });

    (this.prisma as any).$on('error', (e: any) => {
      logger.error('Database error:', {
        target: e.target,
        message: e.message,
      });
    });

    (this.prisma as any).$on('warn', (e: any) => {
      logger.warn('Database warning:', {
        target: e.target,
        message: e.message,
      });
    });

    (this.prisma as any).$on('info', (e: any) => {
      logger.info('Database info:', {
        target: e.target,
        message: e.message,
      });
    });
  }

  private setupGracefulShutdown(): void {
    const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGQUIT'];

    shutdownSignals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}. Shutting down database connection...`);
        try {
          await this.disconnect();
          process.exit(0);
        } catch (error) {
          logger.error('Error during database shutdown:', error);
          process.exit(1);
        }
      });
    });

    process.on('uncaughtException', async error => {
      logger.error('Uncaught exception:', error);
      await this.disconnect();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      await this.disconnect();
      process.exit(1);
    });
  }
}

export const databaseManager = DatabaseManager.getInstance();
export const prisma = databaseManager.client;
