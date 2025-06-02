import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { validatePayment, validatePaymentNotification } from '../validators/payment.validator';
import { jwtAuthNotRequired, basicAuth } from '../../../middlewares';

const router = Router();
const paymentController = new PaymentController();

router.post(
  '/notification',
  validatePaymentNotification,
  paymentController.handlePaymentNotification,
);
router.post('/', jwtAuthNotRequired, validatePayment, paymentController.paymentTransaction);
router.get('/status/:paymentNumber', basicAuth, paymentController.getPaymentStatus);

export default router;
