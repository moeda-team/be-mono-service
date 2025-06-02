export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data: T | null;
}

export type ApiSuccessResponse<T> = ApiResponse<T> & {
  status: 'success';
};

export type ApiErrorResponse = ApiResponse<null> & {
  status: 'error';
  error?: {
    code?: string;
    details?: unknown;
  };
};
