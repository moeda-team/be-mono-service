import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../config/database';
import { MidtransPayload, PaymentDTO, PaymentNotification } from '../models/payment';
import { axiosPost } from '../../../utils/common/axios.custom';

export class PaymentController {
  async paymentTransaction(req: Request, res: Response) {
    const transactionData: PaymentDTO = req.body;

    try {
      const findTransaction = await prisma.transaction.findFirst({
        where: {
          paymentNumber: transactionData.transactionDetails.orderId,
        },
        include: {
          subTransactions: true,
        },
      });

      if (!findTransaction) {
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }

      if (!findTransaction.subTransactions.length) {
        return ResponseHandler.error(res, {
          message: 'Sub transactions not found',
          statusCode: 404,
        });
      }

      // ✅ Build item details ONLY from DB values
      const itemDetails = findTransaction.subTransactions.map(item => ({
        id: item.id,
        price: Number(item.price) + Number(item.addOnPrice || 0),
        quantity: item.quantity,
        name: item.menuName,
      }));

      // ✅ Only push non-zero values
      if (Number(findTransaction.tax) > 0) {
        itemDetails.push({
          id: 'tax',
          price: Number(findTransaction.tax),
          quantity: 1,
          name: 'Tax',
        });
      }

      if (Number(findTransaction.serviceCharge) > 0) {
        itemDetails.push({
          id: 'service_charge',
          price: Number(findTransaction.serviceCharge),
          quantity: 1,
          name: 'Service Charge',
        });
      }

      if (Number(findTransaction.rounding) > 0) {
        itemDetails.push({
          id: 'rounding',
          price: Number(findTransaction.rounding),
          quantity: 1,
          name: 'Rounding',
        });
      }

      if (Number(findTransaction.discount) > 0) {
        itemDetails.push({
          id: 'discount',
          price: -Number(findTransaction.discount),
          quantity: 1,
          name: 'Discount',
        });
      }

      // 🔥 STRICT VALIDATION BEFORE MIDTRANS
      const calculatedTotal = itemDetails.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
      );

      const dbTotal = Number(findTransaction.total);

      if (calculatedTotal !== dbTotal) {
        return ResponseHandler.error(res, {
          message: `Total mismatch. DB: ${dbTotal}, Items: ${calculatedTotal}`,
          statusCode: 400,
        });
      }

      const payload: MidtransPayload = {
        payment_type: transactionData.paymentType,
        transaction_details: {
          order_id: findTransaction.paymentNumber,
          gross_amount: dbTotal,
        },
        customer_details: {
          first_name: findTransaction.customerName || 'Customer',
          last_name: findTransaction.customerName || '',
        },
        item_details: itemDetails,
      };

      if (payload.transaction_details.gross_amount === 0) {
        return ResponseHandler.error(res, {
          message: 'This transaction has total is zero, please check the items or total',
          statusCode: 400,
        });
      }

      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      if (!serverKey) {
        throw new Error('Midtrans server key is not configured');
      }

      const BASE64_AUTH = Buffer.from(`${serverKey}:`).toString('base64');
      const MIDTRANS_URL =
        process.env.MIDTRANS_IS_PRODUCTION === 'true'
          ? 'https://api.midtrans.com'
          : 'https://api.sandbox.midtrans.com';

      const result = await axiosPost(req, res, `${MIDTRANS_URL}/v2/charge`, payload, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${BASE64_AUTH}`,
        },
      });

      if (result.status_code !== '201') {
        return ResponseHandler.error(res, {
          message: result?.data?.status_message || 'Transaction payment failed',
          statusCode: Number(result?.data?.status_code || 500),
        });
      }

      return ResponseHandler.success(res, {
        message: 'Transaction payment successful',
        data: result,
      });
    } catch (error) {
      logger.error('Error during transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return ResponseHandler.error(res, {
        message: errorMessage,
        statusCode: 500,
      });
    }
  }

  async handlePaymentNotification(req: Request, res: Response) {
    try {
      const notification: PaymentNotification = req.body;
      logger.info('Payment notification received:', notification);

      const orderId = notification.order_id;
      const transactionStatus = notification.transaction_status;
      const fraudStatus = notification.fraud_status;
      const paymentType = notification.payment_type;

      const transaction = await prisma.transaction.findFirst({
        where: {
          paymentNumber: orderId,
        },
        include: {
          subTransactions: true,
        },
      });
      if (!transaction) {
        logger.error(`Transaction with payment number ${orderId} not found`);
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }

      let newStatus = 'pending';
      if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
        newStatus = 'completed';
      } else if (transactionStatus === 'pending') {
        newStatus = 'pending';
      } else if (
        transactionStatus === 'deny' ||
        transactionStatus === 'cancel' ||
        transactionStatus === 'expire' ||
        transactionStatus === 'failure'
      ) {
        newStatus = 'failed';
      }

      if (paymentType === 'credit_card' && fraudStatus === 'challenge') {
        newStatus = 'challenge';
      }

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: newStatus,
          fraudStatus,
        },
      });

      if (newStatus === 'completed') {
        await prisma.logTableMove.create({
          data: {
            outletId: transaction?.outletId,
            transactionId: transaction?.id,
            prevTableId: transaction?.tableId,
            nextTableId: null,
          },
        });
      }

      logger.info(`Transaction ${transaction.id} status updated to ${newStatus}`);

      return ResponseHandler.success(res, {
        message: 'Notification processed successfully',
        data: null,
      });
    } catch (error) {
      logger.error('Error processing payment notification:', error);
      return ResponseHandler.success(res, {
        message: 'Notification received',
        data: null,
      });
    }
  }

  async getPaymentStatus(req: Request, res: Response) {
    const { paymentNumber } = req.params;

    try {
      const transaction = await prisma.transaction.findFirst({
        where: {
          paymentNumber,
        },
        include: {
          subTransactions: true,
          voucher: true,
          table: true,
        },
      });

      if (!transaction) {
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }

      return ResponseHandler.success(res, {
        message: 'Payment status retrieved successfully',
        data: {
          details: transaction,
          paymentNumber,
          status: transaction.status,
          updatedAt: transaction.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Error getting payment status:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
        statusCode: 500,
      });
    }
  }
}
