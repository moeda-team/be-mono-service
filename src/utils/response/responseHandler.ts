import { Response } from 'express';
import { ApiSuccessResponse, ApiErrorResponse } from '../../types/response.types';

export class ResponseHandler {
  static success<T>(
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
    const response: ApiSuccessResponse<T> = {
      status: 'success',
      message,
      data,
    };

    return res.status(statusCode).json(response);
  }

  static error(
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
    const response: ApiErrorResponse = {
      status: 'error',
      message,
      data: null,
      error,
    };

    return res.status(statusCode).json(response);
  }
}
