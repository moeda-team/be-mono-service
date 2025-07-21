import { Router } from 'express';
import voucherRouter from './voucher.routes';

const router = Router();

router.use('/', voucherRouter);

export default router;
