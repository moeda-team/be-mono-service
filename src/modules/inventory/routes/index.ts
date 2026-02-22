import { Router } from 'express';
import inventoryRouter from './inventory.routes';

const router = Router();

router.use('/', inventoryRouter);

export default router;
