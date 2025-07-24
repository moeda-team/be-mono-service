import { Router } from 'express';
import attendanceRouter from './attendance.routes';

const router = Router();

router.use('/', attendanceRouter);

export default router;
