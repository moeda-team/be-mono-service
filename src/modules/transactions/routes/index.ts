import { Router } from 'express';
import transactionRouter from './transaction.routes';
import paymentRouter from './payment.routes';

const router = Router();

router.use('/main', transactionRouter);
router.use('/payments', paymentRouter);

export default router;
