import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { CreateTableDTO, UpdateTableDTO } from '../models/table.model';
import { TableService } from '../services/table.service';
import { BaseController } from './base.controller';

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
      return this.sendError(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  getTablesByOutlet = async (req: Request, res: Response) => {
    try {
      const outletId = req.headers.Outletid as string;

      const tables = await tableService.getTablesByOutlet(outletId);

      return this.sendSuccess(res, {
        message: 'Tables retrieved successfully',
        data: tables,
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

      const table = await tableService.getTableById(id);

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
      return this.sendError(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  };

  getTablesByStatus = async (req: Request, res: Response) => {
    try {
      const { outletId, status } = req.params;

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
