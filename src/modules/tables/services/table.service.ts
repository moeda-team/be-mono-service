import { logger } from '../../../utils/common/logger';
import { CreateTableDTO, UpdateTableDTO, Table } from '../models/table.model';
import prisma from '../../../config/database';

export class TableService {
  async createTable(data: CreateTableDTO): Promise<Table> {
    try {
      const table = await prisma.tables.create({
        data: {
          ...data,
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

  async getTablesByOutlet(outletId: string): Promise<Table[]> {
    try {
      const tables = await prisma.tables.findMany({
        where: { outletId },
        include: {
          outlet: true,
        },
        orderBy: { name: 'asc' },
      });

      return tables;
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
      const table = await prisma.tables.update({
        where: { id },
        data,
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
