import { Router } from 'express';
import reportRouter from './report.routes';
import cashBookRouter from './cashBook.routes';

const router = Router();

router.use('/', reportRouter);
router.use('/cash-books', cashBookRouter);

export default router;
