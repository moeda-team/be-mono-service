import { logger } from '../utils/common/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGQUIT'];
shutdownSignals.forEach(signal => {
  process.on(signal, async () => {
    try {
      await prisma.$disconnect();
    } catch (err) {
      logger.info('Error while disconnecting Prisma', err);
    } finally {
      process.exit(0);
    }
  });
});

export default prisma;
