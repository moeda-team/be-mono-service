import { Router } from 'express';
import reportRouter from './report.routes';

const router = Router();

router.use('/', reportRouter);

export default router;
