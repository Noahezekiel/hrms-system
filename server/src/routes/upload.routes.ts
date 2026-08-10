import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authMiddleware, requireCompanyAdmin } from '../middleware/authMiddleware';
import { uploadLimiter } from '../middleware/rateLimiter';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const router = Router();
const uploadController = new UploadController();

const storage = multer.memoryStorage();

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, GIF, WEBP, and SVG are allowed.'));
  }
};

// General upload
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  },
});

// Image upload
const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  },
});

router.use(authMiddleware);

router.post(
  '/single',
  uploadLimiter,
  upload.single('file'),
  uploadController.uploadSingle
);

router.post(
  '/multiple',
  uploadLimiter,
  upload.array('files', 10),
  uploadController.uploadMultiple
);

router.post(
  '/employee/:employeeId/avatar',
  uploadLimiter,
  uploadImage.single('avatar'),
  requireCompanyAdmin,
  uploadController.uploadEmployeeAvatar
);

router.post(
  '/company/:companyId/logo',
  uploadLimiter,
  uploadImage.single('logo'),
  requireCompanyAdmin,
  uploadController.uploadCompanyLogo
);

router.delete('/:publicId', requireCompanyAdmin, uploadController.deleteFile);

export default router;