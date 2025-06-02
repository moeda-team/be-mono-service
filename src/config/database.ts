import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const defaultSchema = process.env.DB_SCHEMA || 'users';

const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cafe_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
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

export default pool;
export { defaultSchema };
