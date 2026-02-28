import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { validateCreateFile } from '../validators/file.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import multer from 'multer';

const router = Router();
const fileController = new FileController();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  upload.single('file'),
  validateCreateFile,
  fileController.uploadFile,
);

export default router;
