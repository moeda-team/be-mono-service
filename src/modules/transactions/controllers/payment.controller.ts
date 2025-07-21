import { Request, Response } from 'express';
import { logger } from '../../../utils/common/logger';
import { ResponseHandler } from '../../../utils/response/responseHandler';
import prisma from '../../../lib/prisma';
import { MidtransPayload, PaymentDTO, PaymentNotification } from '../models/payment';
import { axiosPost } from '../../../utils/common/axios.custom';

export class PaymentController {
  async paymentTransaction(req: Request, res: Response) {
    const transactionData: PaymentDTO = req.body;
    logger.info('Transaction data:', transactionData);

    try {
      const findTransaction = await prisma.transaction.findFirst({
        where: {
          paymentNumber: transactionData.transactionDetails.orderId,
        },
      });
      if (!findTransaction) {
        return ResponseHandler.error(res, {
          message: 'Transaction not found',
          statusCode: 404,
        });
      }

      const subTransactions = await prisma.subTransaction.findMany({
        where: {
          transactionId: findTransaction.id,
        },
      });
      if (!subTransactions) {
        return ResponseHandler.error(res, {
          message: 'Sub transactions not found',
          statusCode: 404,
        });
      }

      const itemDetails = subTransactions.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.menuName,
      }));
      itemDetails.push({
        id: 'service_charge',
        price: findTransaction.serviceCharge,
        quantity: 1,
        name: 'Service Charge',
      });
      itemDetails.push({
        id: 'discount',
        price: findTransaction.discount,
        quantity: 1,
        name: 'Discount',
      });
      itemDetails.push({
        id: 'rounding',
        price: findTransaction.rounding,
        quantity: 1,
        name: 'Rounding',
      });

      const payload: MidtransPayload = {
        payment_type: transactionData.paymentType,
        transaction_details: {
          order_id: transactionData.transactionDetails.orderId,
          gross_amount: findTransaction.total.toNumber(),
        },
        customer_details: {
          first_name: findTransaction.customerName,
          last_name: findTransaction.customerName,
        },
        item_details: itemDetails,
      };

      if (transactionData.paymentType === 'gopay') {
        payload.gopay = {
          enable_callback: true,
          callback_url: 'https://yourdomain.com/payment/callback',
        };
      } else if (transactionData.paymentType === 'shopeepay') {
        payload.shopeePay = {
          callback_url: 'https://yourdomain.com/payment/callback',
        };
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
          message: result.status_message,
          statusCode: Number(result.status_code),
        });
      }

      return ResponseHandler.success(res, {
        message: 'Transaction payment successful',
        data: result,
      });
    } catch (error) {
      logger.error('Error during transaction:', error);
      return ResponseHandler.error(res, {
        message: 'Internal server error',
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
