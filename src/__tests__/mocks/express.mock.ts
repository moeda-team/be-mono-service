import { Request, Response } from 'express';

// Extend Express Request to include user property using module augmentation
import 'express';

declare module 'express' {
  interface Request {
    user?: Record<string, unknown>;
  }
}

// Define type for mock request data
type MockRequestData = {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  user?: Record<string, unknown>;
};

// Mock Express Request
export const mockRequest = (data?: MockRequestData): Partial<Request> => {
  const req: Partial<Request> = {
    body: data?.body || {},
    params: data?.params || {},
    query: data?.query || {},
    headers: data?.headers || {},
    cookies: data?.cookies || {},
    user: data?.user || undefined,
  };
  return req;
};

// Mock Express Response
export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

// Mock Next function
export const mockNext = jest.fn();

// Add a test to prevent the "test suite must contain at least one test" error
describe('Express Mocks', () => {
  it('should create mock request with default values', () => {
    const req = mockRequest();
    expect(req.body).toEqual({});
    expect(req.params).toEqual({});
    expect(req.query).toEqual({});
    expect(req.headers).toEqual({});
    expect(req.cookies).toEqual({});
    expect(req.user).toBeUndefined();
  });

  it('should create mock response with jest functions', () => {
    const res = mockResponse();
    expect(jest.isMockFunction(res.status)).toBe(true);
    expect(jest.isMockFunction(res.json)).toBe(true);
    expect(jest.isMockFunction(res.send)).toBe(true);
    expect(jest.isMockFunction(res.cookie)).toBe(true);
    expect(jest.isMockFunction(res.clearCookie)).toBe(true);
  });
});
