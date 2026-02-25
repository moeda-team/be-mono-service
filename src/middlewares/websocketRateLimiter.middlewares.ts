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

// More lenient rate limiter for WebSocket routes
export const websocketRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 200, // Much higher limit for WebSocket polling
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: {
    error: 'Too many WebSocket requests, please try again later',
  },
});
