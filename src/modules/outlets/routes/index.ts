import { Router } from 'express';
import outletRouter from './outlet.routes';

const router = Router();

router.use('/', outletRouter);

export default router;
