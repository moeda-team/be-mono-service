import { Router } from 'express';
import menuRouter from './menu.routes';
import categoryRouter from './category.routes';
import optionRouter from './option.routes';
import bestSellerMenuRouter from './best-seller-menu.routes';

const router = Router();

router.use('/main', menuRouter);
router.use('/categories', categoryRouter);
router.use('/options', optionRouter);
router.use('/best-seller', bestSellerMenuRouter);

export default router;
