export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource Not Found
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  OUTLET_NOT_FOUND = 'OUTLET_NOT_FOUND',
  MENU_NOT_FOUND = 'MENU_NOT_FOUND',
  VOUCHER_NOT_FOUND = 'VOUCHER_NOT_FOUND',

  // Business Logic
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  VOUCHER_EXPIRED = 'VOUCHER_EXPIRED',
  VOUCHER_LIMIT_REACHED = 'VOUCHER_LIMIT_REACHED',
  TABLE_MOVE_LIMIT_REACHED = 'TABLE_MOVE_LIMIT_REACHED',
  INVALID_TRANSACTION_STATUS = 'INVALID_TRANSACTION_STATUS',
  CONFLICT = 'CONFLICT',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',

  // External Services
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    details?: unknown,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code?: ErrorCode, details?: unknown): AppError {
    return new AppError(message, 400, code || ErrorCode.INVALID_INPUT, true, details);
  }

  static unauthorized(message: string = 'Unauthorized', code?: ErrorCode): AppError {
    return new AppError(message, 401, code || ErrorCode.UNAUTHORIZED);
  }

  static forbidden(message: string = 'Forbidden', code?: ErrorCode): AppError {
    return new AppError(message, 403, code || ErrorCode.FORBIDDEN);
  }

  static notFound(message: string = 'Resource not found', code?: ErrorCode): AppError {
    return new AppError(message, 404, code || ErrorCode.NOT_FOUND);
  }

  static conflict(message: string, code?: ErrorCode, details?: unknown): AppError {
    return new AppError(message, 409, code || ErrorCode.VALIDATION_ERROR, true, details);
  }

  static tooManyRequests(message: string = 'Too many requests'): AppError {
    return new AppError(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED);
  }

  static internal(message: string = 'Internal server error', details?: unknown): AppError {
    return new AppError(message, 500, ErrorCode.INTERNAL_SERVER_ERROR, false, details);
  }

  static serviceUnavailable(message: string = 'Service unavailable'): AppError {
    return new AppError(message, 503, ErrorCode.EXTERNAL_SERVICE_ERROR);
  }
}
