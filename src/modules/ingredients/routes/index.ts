import { Router } from 'express';
import ingredientsRouter from './ingredient.routes';

const router = Router();

router.use('/', ingredientsRouter);

export default router;
