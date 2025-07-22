import { Router } from 'express';
import stockRouter from './stock.routes';
import logStockRouter from './log_stock.routes';

const router = Router();

router.use('/main', stockRouter);
router.use('/log', logStockRouter);

export default router;
