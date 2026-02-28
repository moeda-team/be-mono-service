import { Response } from 'express';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { ApiSuccessResponse, ApiErrorResponse } from '../../../types/response.types';

export abstract class BaseController {
  protected sendSuccess<T>(
    res: Response,
    {
      message,
      data,
      statusCode = 200,
      pagination,
      page,
      limit,
      total,
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
      page?: number;
      limit?: number;
      total?: number;
    },
  ): Response<ApiSuccessResponse<T>> {
    if (page && limit && total !== undefined) {
      return this.sendSuccess(res, {
        message,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
    return ResponseHandler.success(res, { message, data, statusCode, pagination });
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
