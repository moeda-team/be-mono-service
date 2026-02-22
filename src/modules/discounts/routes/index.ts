import { Router } from 'express';
import discountRouter from './discount.routes';

const router = Router();

router.use('/', discountRouter);

export default router;
