/**
 * Tests for src/app.ts to reach 100 % coverage on that file.
 * We heavily mock external dependencies so the module can be required in isolation.
 */

import request from 'supertest';
import express from 'express';

// ---------- mocks ----------

jest.mock('helmet', () => jest.fn(() => (req: any, _res: any, next: any) => next()));
jest.mock('connect-timeout', () => jest.fn(() => (req: any, _res: any, next: any) => next()));

jest.mock('morgan', () => jest.fn(() => (req: any, _res: any, next: any) => next()));

// capture cors options so we can exercise its origin callback
let capturedCorsOptions: any;
jest.mock('cors', () =>
  jest.fn((options: any) => {
    capturedCorsOptions = options;
    return (req: any, _res: any, next: any) => next();
  }),
);

// simple pass-through rate limiter
jest.mock('@/middlewares', () => ({
  rateLimiter: (req: any, _res: any, next: any) => next(),
  notFoundHandler: (req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(404).send('Not found');
  },
  errorHandler: (_err: any, _req: any, res: any, _next: any) => {
    res.status(500).send('Err');
  },
}));

// silence logger
jest.mock('@/utils/common/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

// response handler so we can assert timeout branch later
export const errorSpy = jest.fn();
jest.mock('@/utils/response/responseHandler', () => ({
  ResponseHandler: { error: (...args: any[]) => errorSpy(...args) },
}));

// mock config with predictable values
jest.mock('@/config', () => ({
  config: {
    apiPrefix: '/api',
    corsOrigin: 'http://allowed.com, http://another.com',
  },
}));

// mock all routers used inside app so they don’t pull huge dependency trees
const mockRouter = express.Router();
[
  'users',
  'messages',
  'transactions',
  'outlets',
  'menus',
  'vouchers',
  'stocks',
  'ingredients',
  'files',
  'attendance',
].forEach(name => {
  jest.mock(`@/modules/${name}/routes`, () => mockRouter);
});

// ---------- import app (after mocks) ----------
import { app } from '@/app';

describe('app.ts', () => {
  it('allows request from whitelisted origin', async () => {
    const res = await request(app).get('/unknown').set('Origin', 'http://allowed.com');
    expect(res.status).toBe(404); // notFoundHandler kicks in
    // ensure the cors origin callback treated it as allowed
    const originFn = capturedCorsOptions.origin;
    const cb = jest.fn();
    originFn('http://allowed.com', cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('blocks request from disallowed origin via cors origin callback', () => {
    const originFn = capturedCorsOptions.origin;
    const cb = jest.fn();
    originFn('http://evil.com', cb);
    expect(cb.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});
