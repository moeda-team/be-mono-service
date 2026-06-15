import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { validatePayment, validatePaymentNotification } from '../validators/payment.validator';
import { jwtAuthNotRequired, basicAuth } from '../../../middlewares';

/**
 * @openapi
 * /transactions/payments:
 *   post:
 *     tags: [Payments]
 *     summary: Create a payment for a transaction
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId: { type: string, format: uuid }
 *               paymentMethod: { type: string, example: qris }
 *     responses:
 *       '200': { description: Payment created }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *
 * /transactions/payments/notification:
 *   post:
 *     tags: [Payments]
 *     summary: Payment gateway notification webhook (Midtrans)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, additionalProperties: true }
 *     responses:
 *       '200': { description: Notification processed }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *
 * /transactions/payments/status/{paymentNumber}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment status by payment number
 *     security: []
 *     parameters:
 *       - name: paymentNumber
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: OK }
 *       '404': { $ref: '#/components/responses/NotFound' }
 */
const router = Router();
const paymentController = new PaymentController();

router.post(
  '/notification',
  validatePaymentNotification,
  paymentController.handlePaymentNotification,
);
router.post('/', jwtAuthNotRequired, validatePayment, paymentController.paymentTransaction);
router.get('/status/:paymentNumber', jwtAuthNotRequired, paymentController.getPaymentStatus);

export default router;
