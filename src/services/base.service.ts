import { logger } from '../utils/common/logger';
import { AppError, ErrorCode } from '../utils/errors/custom.errors';
import { PrismaClient } from '@prisma/client';
import { databaseManager, prisma } from '../config/database';

export abstract class BaseService {
  protected readonly prisma = prisma;
  protected readonly logger = logger;

  protected handleDatabaseError(error: unknown): never {
    if (error instanceof Error) {
      this.logger.error('Database operation failed:', error);

      if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any;

        switch (prismaError.code) {
          case 'P2002':
            throw AppError.conflict('Resource already exists', ErrorCode.CONFLICT, {
              field: prismaError.meta?.target,
            });
          case 'P2025':
            throw AppError.notFound('Record not found', ErrorCode.NOT_FOUND);
          case 'P2003':
            throw AppError.badRequest(
              'Foreign key constraint violation',
              ErrorCode.VALIDATION_ERROR,
            );
          default:
            throw AppError.internal('Database operation failed', {
              prismaCode: prismaError.code,
            });
        }
      }

      throw AppError.internal('Database operation failed', {
        error: error.message,
        stack: error.stack,
      });
    }

    throw AppError.internal('Unknown database error');
  }

  protected async executeWithTransaction<T>(
    operation: (
      tx: Omit<
        PrismaClient,
        '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
      >,
    ) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(operation);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  protected validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      throw AppError.badRequest(
        `Missing required fields: ${missingFields.join(', ')}`,
        ErrorCode.MISSING_REQUIRED_FIELD,
        { missingFields },
      );
    }
  }

  protected validateUUID(uuid: string, fieldName: string = 'id'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuid)) {
      throw AppError.badRequest(`${fieldName} must be a valid UUID`, ErrorCode.INVALID_INPUT, {
        field: fieldName,
        value: uuid,
      });
    }
  }

  protected async checkEntityExists<T>(model: any, id: string, entityName: string): Promise<T> {
    this.validateUUID(id);

    const entity = await model.findUnique({
      where: { id },
    });

    if (!entity) {
      throw AppError.notFound(`${entityName} not found`, ErrorCode.NOT_FOUND);
    }

    return entity as unknown as T;
  }

  protected paginate(page?: number, limit?: number) {
    if (!page || !limit) {
      return { skip: undefined, take: undefined };
    }

    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }

  protected buildWhereClause(filters: Record<string, any>): Record<string, any> {
    const whereClause: Record<string, any> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && value.includes('*')) {
          // Handle wildcard searches
          whereClause[key] = {
            contains: value.replace(/\*/g, ''),
            mode: 'insensitive',
          };
        } else {
          whereClause[key] = value;
        }
      }
    });

    return whereClause;
  }
}
