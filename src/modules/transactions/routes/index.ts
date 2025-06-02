import { Router } from 'express';
import transactionRouter from './transaction.routes';
import paymentRouter from './payment.routes';
import orderRouter from './order.routes';
import salesRouter from './sales.routes';

const router = Router();

router.use('/main', transactionRouter);
router.use('/payments', paymentRouter);
router.use('/order', orderRouter);
router.use('/sales', salesRouter);

export default router;
