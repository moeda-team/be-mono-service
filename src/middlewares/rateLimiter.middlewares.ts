import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const getHeaderValue = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const getClientIp = (req: Request): string => {
  const realIp = getHeaderValue(req.headers['x-real-ip']);
  const forwardedFor = getHeaderValue(req.headers['x-forwarded-for']);
  const cfIp = getHeaderValue(req.headers['cf-connecting-ip']);

  return (
    realIp || forwardedFor?.split(',')[0].trim() || cfIp || req.socket.remoteAddress || 'unknown-ip'
  );
};

export const rateLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
});
