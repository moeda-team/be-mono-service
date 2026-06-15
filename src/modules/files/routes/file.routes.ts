import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { validateCreateFile } from '../validators/file.validator';
import { jwtAuth, requirePermission } from '../../../middlewares';
import { UserRole } from '../../../utils/auth/jwt';
import multer from 'multer';

/**
 * @openapi
 * /files:
 *   post:
 *     tags: [Files]
 *     summary: Upload a file (min role STORE_MANAGER, max 5 MB)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *                 example: icon
 *     responses:
 *       '200':
 *         description: Uploaded
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         fileUrl: { type: string }
 *       '400': { $ref: '#/components/responses/BadRequest' }
 *       '403': { $ref: '#/components/responses/Forbidden' }
 */
const router = Router();
const fileController = new FileController();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  '/',
  jwtAuth,
  requirePermission(UserRole.STORE_MANAGER),
  upload.single('file'),
  validateCreateFile,
  fileController.uploadFile,
);

export default router;
