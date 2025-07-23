import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { validateCreateFile } from '../validators/file.validator';
import { HealthController } from '../controllers/health.controller';
import { jwtAuth, roleAuth } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import multer from 'multer';

const router = Router();
const fileController = new FileController();
const healthController = new HealthController();

const storage = multer.memoryStorage();
const fileFilter = (
  _: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};
const upload = multer({ storage, fileFilter });

router.get('/health', healthController.check);
router.post(
  '/',
  jwtAuth,
  roleAuth(UserRole.STORE_MANAGER),
  upload.single('file'),
  validateCreateFile,
  fileController.uploadFile,
);

export default router;
