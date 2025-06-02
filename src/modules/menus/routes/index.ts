import { Router } from 'express';
import menuRouter from './menu.routes';
import categoryRouter from './category.routes';

const router = Router();

router.use('/main', menuRouter);
router.use('/categories', categoryRouter);

export default router;
