import { Response } from 'express';
import { ApiSuccessResponse, ApiErrorResponse } from '../../types/response.types';

export class ResponseHandler {
  static success<T>(
    res: Response,
    {
      message,
      data,
      statusCode = 200,
      pagination,
    }: {
      message: string;
      data: T;
      statusCode?: number;
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    },
  ): Response<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
      status: 'success',
      message,
      data,
      ...(pagination && { pagination }),
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
