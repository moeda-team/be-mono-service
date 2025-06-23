import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/common/logger';

dotenv.config();

const defaultSchema = process.env.DB_SCHEMA || 'mono';

const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cafe_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT_MS || '2000', 10),
};

const pool = new Pool(poolConfig);

pool
  .query(`CREATE SCHEMA IF NOT EXISTS ${defaultSchema}`)
  .then(() => {
    logger.info(`Schema '${defaultSchema}' is ready`);
    return pool.query(`SET search_path TO ${defaultSchema}, public`);
  })
  .catch(err => {
    logger.error('Error initializing database schema:', err);
  });

pool.on('connect', client => {
  client.query(`SET search_path TO ${defaultSchema}, public`);
});

const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGQUIT'];
shutdownSignals.forEach(signal => {
  process.on(signal, async () => {
    try {
      logger.info(`Received ${signal}. Closing database pool...`);
      await pool.end();
      logger.info('Database pool closed. Exiting process.');
      process.exit(0);
    } catch (err) {
      logger.error('Error while closing database pool', err);
      process.exit(1);
    }
  });
});

export default pool;
export { defaultSchema };
