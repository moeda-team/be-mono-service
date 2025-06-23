import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { validateCreateMessage } from '../validators/message.validator';
import { HealthController } from '../controllers/health.controller';
import { basicAuth, jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const messageController = new MessageController();
const healthController = new HealthController();

router.get('/health', healthController.check);
router.get('/:id', jwtAuth, roleAuth(UserRole.STORE_MANAGER), messageController.getMessageById);
router.get('/', jwtAuth, roleAuth(UserRole.STORE_MANAGER), messageController.getAllMessages);
router.post('/', basicAuth, validateCreateMessage, messageController.createMessage);

export default router;
