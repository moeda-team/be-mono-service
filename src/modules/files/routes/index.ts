import { Router } from 'express';
import fileRouter from './file.routes';

const router = Router();

router.use('/', fileRouter);

export default router;
