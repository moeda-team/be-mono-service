import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { validateCreateMessage } from '../validators/message.validator';
import { basicAuth, jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';

const router = Router();
const messageController = new MessageController();

router.get(
  '/:id',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  messageController.getMessageById,
);
router.get(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  messageController.getAllMessages,
);
router.post('/', basicAuth, validateCreateMessage, messageController.createMessage);

export default router;
