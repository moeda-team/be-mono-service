import { Router } from 'express';
import stockRouter from './stock.routes';

const router = Router();

router.use('/', stockRouter);

export default router;
