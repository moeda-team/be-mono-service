import { Router } from 'express';
import tableRouter from './table.routes';

const router = Router();

router.use('/', tableRouter);

export default router;
