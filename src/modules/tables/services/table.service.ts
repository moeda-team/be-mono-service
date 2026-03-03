import { logger } from '../../../utils/common/logger';
import { CreateTableDTO, UpdateTableDTO, Table } from '../models/table.model';
import prisma from '../../../config/database';
import { AppError } from '../../../utils/errors/custom.errors';

export class TableService {
  async createTable(data: CreateTableDTO): Promise<Table> {
    try {
      // Validation: Check if table name is provided
      if (!data.name || data.name.trim() === '') {
        throw AppError.badRequest('Table number is required');
      }

      // Validation: Check if table name format is valid (allows alphanumeric with spaces)
      const tableNamePattern = /^[a-zA-Z0-9\s]+$/;
      if (!tableNamePattern.test(data.name.trim())) {
        throw AppError.badRequest('Table name can only contain letters, numbers, and spaces');
      }

      // Validation: Check if status is valid
      if (
        data.status &&
        !['available', 'occupied', 'cleaning', 'out_of_order'].includes(data.status)
      ) {
        throw AppError.badRequest(
          'Status must be either "available", "occupied", "cleaning", or "out_of_order"',
        );
      }

      // Validation: Check for duplicate table name within the same outlet
      const existingTable = await prisma.tables.findFirst({
        where: {
          name: data.name.trim(),
          outletId: data.outletId,
        },
      });

      if (existingTable) {
        throw AppError.conflict('Table number already exists');
      }

      // Validation: Check if table number (numeric part) already exists in the same outlet
      const numericPattern = /\d+/;
      const numericMatch = data.name.trim().match(numericPattern);

      if (numericMatch) {
        const tableNumber = numericMatch[0];
        const tablesWithSameNumber = await prisma.tables.findMany({
          where: {
            outletId: data.outletId,
            name: {
              contains: tableNumber,
              mode: 'insensitive',
            },
          },
        });

        if (tablesWithSameNumber.length > 0) {
          throw AppError.conflict(`Table number ${tableNumber} already exists`);
        }
      }

      const table = await prisma.tables.create({
        data: {
          ...data,
          name: data.name.trim(),
          status: data.status || 'available',
        },
        include: {
          outlet: true,
        },
      });

      return table;
    } catch (error) {
      logger.error('Error creating table:', error);
      throw error;
    }
  }

  async getTablesByOutlet(
    outletId: string,
    page?: number | null,
    limit?: number | null,
    search?: string | null,
  ): Promise<{ tables: Table[]; total?: number }> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit || undefined;

      const where: any = { outletId };
      if (search) {
        where.name = { contains: search, mode: 'insensitive' };
      }

      const tables = await prisma.tables.findMany({
        where,
        include: {
          outlet: true,
        },
        orderBy: { name: 'asc' },
        skip,
        take,
      });

      if (page && limit) {
        const total = await prisma.tables.count({ where });
        return { tables, total };
      }

      return { tables };
    } catch (error) {
      logger.error('Error getting tables by outlet:', error);
      throw error;
    }
  }

  async getTableById(id: string): Promise<Table | null> {
    try {
      const table = await prisma.tables.findUnique({
        where: { id },
        include: {
          outlet: true,
        },
      });

      return table;
    } catch (error) {
      logger.error('Error getting table by id:', error);
      throw error;
    }
  }

  async updateTable(id: string, data: UpdateTableDTO): Promise<Table> {
    try {
      // Get the current table to check outletId
      const currentTable = await prisma.tables.findUnique({
        where: { id },
      });
      if (!currentTable) {
        throw AppError.notFound('Table not found');
      }

      // Validation: Check for duplicate table name (if name is being updated)
      if (data.name && data.name.trim() !== '') {
        // Validation: Check if table name format is valid (allows alphanumeric with spaces)
        const tableNamePattern = /^[a-zA-Z0-9\s]+$/;
        if (!tableNamePattern.test(data.name.trim())) {
          throw AppError.badRequest('Table name can only contain letters, numbers, and spaces');
        }

        const existingTable = await prisma.tables.findFirst({
          where: {
            name: data.name.trim(),
            outletId: currentTable.outletId,
            id: { not: id },
          },
        });

        if (existingTable) {
          throw AppError.conflict('Table number already exists');
        }

        // Validation: Check if table number (numeric part) already exists in the same outlet
        const numericPattern = /\d+/;
        const numericMatch = data.name.trim().match(numericPattern);

        if (numericMatch) {
          const tableNumber = numericMatch[0];
          const tablesWithSameNumber = await prisma.tables.findMany({
            where: {
              outletId: currentTable.outletId,
              name: {
                contains: tableNumber,
                mode: 'insensitive',
              },
              id: { not: id },
            },
          });

          if (tablesWithSameNumber.length > 0) {
            throw AppError.conflict(`Table number ${tableNumber} already exists`);
          }
        }
      }

      // Validation: Check if status is valid
      if (
        data.status &&
        !['available', 'occupied', 'cleaning', 'out_of_order'].includes(data.status)
      ) {
        throw AppError.badRequest(
          'Status must be either "available", "occupied", "cleaning", or "out_of_order"',
        );
      }

      const table = await prisma.tables.update({
        where: { id },
        data: {
          ...data,
          name: data.name ? data.name.trim() : undefined,
        },
        include: {
          outlet: true,
        },
      });

      return table;
    } catch (error) {
      logger.error('Error updating table:', error);
      throw error;
    }
  }

  async deleteTable(id: string): Promise<void> {
    try {
      // Validation: Check if table exists
      const table = await prisma.tables.findUnique({
        where: { id },
      });

      if (!table) {
        throw AppError.notFound('Table not found');
      }

      // Check if table is used in any transaction
      const activeTransaction = await prisma.transaction.findFirst({
        where: {
          tableId: id,
        },
      });

      if (activeTransaction) {
        throw AppError.badRequest(
          'Cannot delete table: Table is currently being used in transaction',
        );
      }

      await prisma.tables.delete({
        where: { id },
      });
    } catch (error) {
      logger.error('Error deleting table:', error);
      throw error;
    }
  }

  async getTablesByStatus(outletId: string, status: string): Promise<Table[]> {
    try {
      const tables = await prisma.tables.findMany({
        where: {
          outletId,
          status,
        },
        include: {
          outlet: true,
        },
        orderBy: { name: 'asc' },
      });

      return tables;
    } catch (error) {
      logger.error('Error getting tables by status:', error);
      throw error;
    }
  }
}
