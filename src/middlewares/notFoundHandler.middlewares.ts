import { Request, Response } from 'express';
import { AppError } from './errorHandler.middlewares';

export const notFoundHandler = (req: Request, _res: Response) => {
  throw new AppError(404, `Route ${req.originalUrl} not found`);
};
