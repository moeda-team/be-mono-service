import { Router } from 'express';
import messagesRouter from './message.routes';

const router = Router();

router.use('/', messagesRouter);

export default router;
