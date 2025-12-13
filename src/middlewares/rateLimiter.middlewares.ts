import rateLimit from 'express-rate-limit';
// import { Request } from 'express';

// const getHeaderValue = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

// const getClientIp = (req: Request): string => {
//   const cfIp = getHeaderValue(req.headers['cf-connecting-ip']);
//   const realIp = getHeaderValue(req.headers['x-real-ip']);
//   const forwardedFor = getHeaderValue(req.headers['x-forwarded-for']);

//   return (
//     cfIp || realIp || forwardedFor?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown-ip'
//   );
// };

export const rateLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
