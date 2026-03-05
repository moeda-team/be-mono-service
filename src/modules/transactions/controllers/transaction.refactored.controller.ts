import { Request, Response } from 'express';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import { TransactionService } from '../../../services/transaction.service';
import { CreateTransactionDTO, TransactionQueryParams } from '../../../types/transaction.types';
import { asyncHandler } from '../../../utils/errors/error.handler';
import { validate, commonValidations } from '../../../utils/validation/validation.middleware';
import { body } from 'express-validator';
import { JwtPayload } from 'jsonwebtoken';

const transactionService = new TransactionService();

export class TransactionController {
  getAllTransactions = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as Request & { user?: { outletId: string } };
    const outletId = user?.outletId;

    const params: TransactionQueryParams = {
      outletId,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      active: req.query.active === 'true',
      table: req.query.table ? parseInt(req.query.table as string) : undefined,
      month: req.query.month ? parseInt(req.query.month as string) : undefined,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
    };

    const result = await transactionService.getAllTransactions(params);

    return ResponseHandler.success(res, {
      message: 'Transactions retrieved successfully',
      data: result,
    });
  });

  getTransactionById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const transaction = await transactionService.getTransactionById(id);

    return ResponseHandler.success(res, {
      message: 'Transaction retrieved successfully',
      data: transaction,
    });
  });

  createTransaction = [
    validate([
      body('outletId').isUUID().withMessage('Outlet ID must be a valid UUID'),
      body('transactionType')
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('Transaction type is required'),
      body('tableId').isUUID().withMessage('Table ID must be a valid UUID'),
      body('paymentMethod')
        .isString()
        .isIn(['cash', 'debit', 'qris'])
        .withMessage('Invalid payment method'),
      body('customerName')
        .optional()
        .isString()
        .isLength({ max: 100 })
        .withMessage('Customer name too long'),
      body('cart').isArray({ min: 1 }).withMessage('Cart must contain at least one item'),
      body('cart.*.menuId').isUUID().withMessage('Menu ID must be a valid UUID'),
      body('cart.*.menuName')
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Menu name is required'),
      body('cart.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
      body('cart.*.price').isFloat({ min: 0 }).withMessage('Price must be non-negative'),
      body('cart.*.subTotal').isFloat({ min: 0 }).withMessage('Subtotal must be non-negative'),
      body('voucher')
        .optional()
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Invalid voucher format'),
      body('additionalNote')
        .optional()
        .isString()
        .isLength({ max: 255 })
        .withMessage('Note too long'),
    ]),
    asyncHandler(async (req: Request, res: Response) => {
      const transactionData: CreateTransactionDTO = req.body;
      const reqWithUser = req as Request & { user?: JwtPayload };
      const userId = reqWithUser.user?.userId;

      const result = await transactionService.createTransaction(transactionData, userId);

      return ResponseHandler.success(res, {
        message: 'Transaction created successfully',
        data: result,
        statusCode: 201,
      });
    }),
  ];

  updateTransactionStatus = [
    validate([
      body('status').isIn(['preparation', 'complete', 'cancelled']).withMessage('Invalid status'),
    ]),
    asyncHandler(async (req: Request, res: Response) => {
      const { id } = req.params;
      const { status } = req.body;

      await transactionService.updateTransactionStatus(id, status);

      return ResponseHandler.success(res, {
        message: 'Transaction status updated successfully',
        data: null,
      });
    }),
  ];

  deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // This would be implemented in the service
    // await transactionService.deleteTransaction(id);

    return ResponseHandler.success(res, {
      message: 'Transaction deleted successfully',
      data: null,
    });
  });

  checkTransactionStatus = asyncHandler(async (req: Request, res: Response) => {
    const { orderIds } = req.body;

    // This would be implemented in the service
    // const result = await transactionService.checkTransactionStatus(orderIds);

    return ResponseHandler.success(res, {
      message: 'Transaction status checked successfully',
      data: [], // placeholder
    });
  });

  getAllActiveTransactions = asyncHandler(async (req: Request, res: Response) => {
    const { user } = req as Request & { user?: { outletId: string } };
    const outletId = user?.outletId;

    // This would be implemented in the service
    // const result = await transactionService.getAllActiveTransactions(outletId, req.query.search as string);

    return ResponseHandler.success(res, {
      message: 'Active transactions retrieved successfully',
      data: { transactions: [] }, // placeholder
    });
  });

  updateTransactionTable = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tableId, note } = req.body;

    // This would be implemented in the service
    // const result = await transactionService.updateTransactionTable(id, tableId, note);

    return ResponseHandler.success(res, {
      message: 'Transaction table updated successfully',
      data: null, // placeholder
    });
  });
}
