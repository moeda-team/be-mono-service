import { Response } from 'express';
import { ResponseHandler } from '../utils/response/responseHandler';
import { ApiSuccessResponse, ApiErrorResponse } from '../types/response.types';

export abstract class BaseController {
  protected sendSuccess<T>(
    res: Response,
    {
      message,
      data,
      statusCode = 200,
    }: {
      message: string;
      data: T;
      statusCode?: number;
    },
  ): Response<ApiSuccessResponse<T>> {
    return ResponseHandler.success(res, { message, data, statusCode });
  }

  protected sendError(
    res: Response,
    {
      message,
      statusCode = 500,
      error,
    }: {
      message: string;
      statusCode?: number;
      error?: {
        code?: string;
        details?: unknown;
      };
    },
  ): Response<ApiErrorResponse> {
    return ResponseHandler.error(res, { message, statusCode, error });
  }
}
