import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateFileDTO } from '../models/file';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { uploadFileToS3 } from '../../../utils/storage/s3';

export class FileController {
  async uploadFile(req: Request, res: Response) {
    const user = (req as Request & { user: { outletId: string } }).user;
    const body: CreateFileDTO = req.body;
    const file = req.file;

    try {
      if (!user.outletId) {
        return ResponseHandler.error(res, {
          message: 'Outlet not found',
          statusCode: 404,
        });
      }

      if (!file) {
        return ResponseHandler.error(res, {
          message: 'File is required',
          statusCode: 400,
        });
      }

      const fileUrl = await uploadFileToS3(
        body.category,
        file.buffer,
        file.originalname,
        file.mimetype,
        process.env.AWS_BUCKET!,
      );

      return ResponseHandler.success(res, {
        message: 'File uploaded successfully',
        data: { ...body, fileUrl },
      });
    } catch (error) {
      logger.error('Error creating voucher:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
