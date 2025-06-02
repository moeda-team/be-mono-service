import { Router } from 'express';
import usersRouter from './user.routes';

const router = Router();

router.use('/', usersRouter);

export default router;
