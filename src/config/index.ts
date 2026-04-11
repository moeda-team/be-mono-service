import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

export const config = {
  nodeEnv,
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  trustProxy:
    (process.env.TRUST_PROXY || '').toLowerCase() === 'true' ||
    (process.env.TRUST_PROXY || '').toLowerCase() === '1' ||
    isProduction,
} as const;

if (isProduction) {
  if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN.trim() === '*') {
    throw new Error('CORS_ORIGIN must be explicitly set in production');
  }

  requireEnv('JWT_ACCESS_SECRET');
  requireEnv('JWT_REFRESH_SECRET');
  requireEnv('JWT_ACCESS_EXPIRES_IN');
  requireEnv('JWT_REFRESH_EXPIRES_IN');
}

export { isProduction };
