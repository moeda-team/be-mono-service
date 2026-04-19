import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateTableDTO, UpdateTableDTO } from '../models/table.model';
import { TableService } from '../services/table.service';
import { BaseController } from './base.controller';
import { AppError } from '../../../utils/errors/custom.errors';
import prisma from '../../../config/database';

const tableService = new TableService();

export class TableController extends BaseController {
  createTable = async (req: Request, res: Response) => {
    try {
      const tableData: CreateTableDTO = req.body;

      const table = await tableService.createTable(tableData);

      return this.sendSuccess(res, {
        message: 'Table created successfully',
        data: table,
      });
    } catch (error) {
      logger.error('Error creating table:', error);

      if (error && typeof error === 'object' && 'message' in error && 'statusCode' in error) {
        return this.sendError(res, {
          message: String(error.message),
          statusCode: Number(error.statusCode),
        });
      }

      return this.sendError(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  getTablesByOutlet = async (req: Request, res: Response) => {
    try {
      const { user } = req as Request & { user?: { outletId?: string } };
      const outletId =
        user?.outletId ||
        (req.params.outletId as string) ||
        (req.headers.outletid as string) ||
        (req.headers.Outletid as string);
      const page = parseInt(req.query.page as string) || null;
      const limit = parseInt(req.query.limit as string) || null;
      const search = (req.query.search as string)?.trim() || null;

      const result = await tableService.getTablesByOutlet(outletId, page, limit, search);

      if (page && limit && result.total !== undefined) {
        return this.sendSuccess(res, {
          message: 'Tables retrieved successfully',
          data: result.tables,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
        });
      }

      return this.sendSuccess(res, {
        message: 'Tables retrieved successfully',
        data: result.tables,
      });
    } catch (error) {
      logger.error('Error getting tables by outlet:', error);
      return this.sendError(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  getTableById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { user } = req as Request & { user?: { outletId?: string } };
      const outletId = user?.outletId;

      const table = await (outletId
        ? prisma.tables.findFirst({
            where: { id, outletId },
            include: {
              outlet: true,
            },
          })
        : tableService.getTableById(id));

      if (!table) {
        return this.sendError(res, {
          message: 'Table not found',
          statusCode: 404,
        });
      }

      return this.sendSuccess(res, {
        message: 'Table retrieved successfully',
        data: table,
      });
    } catch (error) {
      logger.error('Error getting table by id:', error);
      return this.sendError(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  updateTable = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData: UpdateTableDTO = req.body;

      const table = await tableService.updateTable(id, updateData);

      return this.sendSuccess(res, {
        message: 'Table updated successfully',
        data: table,
      });
    } catch (error) {
      logger.error('Error updating table:', error);

      if (error && typeof error === 'object' && 'message' in error && 'statusCode' in error) {
        return this.sendError(res, {
          message: String(error.message),
          statusCode: Number(error.statusCode),
        });
      }

      return this.sendError(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  deleteTable = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const existingTable = await tableService.getTableById(id);
      if (!existingTable) {
        return this.sendError(res, {
          message: 'Table not found',
          statusCode: 404,
        });
      }

      await tableService.deleteTable(id);

      return this.sendSuccess(res, {
        message: 'Table deleted successfully',
        data: { deleted: true },
      });
    } catch (error) {
      logger.error('Error deleting table:', error);

      if (error && typeof error === 'object' && 'message' in error && 'statusCode' in error) {
        return this.sendError(res, {
          message: String(error.message),
          statusCode: Number(error.statusCode),
        });
      }

      return this.sendError(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  getTablesByStatus = async (req: Request, res: Response) => {
    try {
      const { outletId: outletIdParam, status } = req.params;
      const { user } = req as Request & { user?: { outletId?: string } };
      const outletId = user?.outletId || outletIdParam;

      const tables = await tableService.getTablesByStatus(outletId, status);

      return this.sendSuccess(res, {
        message: 'Tables retrieved successfully',
        data: tables,
      });
    } catch (error) {
      logger.error('Error getting tables by status:', error);
      return this.sendError(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };
}
