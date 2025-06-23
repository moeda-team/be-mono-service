import { Router } from 'express';
import menuRouter from './menu.routes';
import categoryRouter from './category.routes';
import optionRouter from './option.routes';

const router = Router();

router.use('/main', menuRouter);
router.use('/categories', categoryRouter);
router.use('/options', optionRouter);

export default router;
