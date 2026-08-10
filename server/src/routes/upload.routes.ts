import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authMiddleware, requireCompanyAdmin } from '../middleware/authMiddleware';
import { uploadLimiter } from '../middleware/rateLimiter';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const router = Router();
const uploadController = new UploadController();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, GIF, WEBP, and SVG are allowed.'));
  }
};

// File filter for documents (kept for future use, but not used yet)
// const documentFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
//   const allowedTypes = [
//     'application/pdf',
//     'application/msword',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'application/vnd.ms-excel',
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//     'text/plain',
//   ];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new ApiError(400, 'Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, and TXT are allowed.'));
//   }
// };

// General upload - any file type
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
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

// All routes require authentication
router.use(authMiddleware);

// Upload single file (general)
router.post(
  '/single',
  uploadLimiter,
  upload.single('file'),
  uploadController.uploadSingle
);

// Upload multiple files (general)
router.post(
  '/multiple',
  uploadLimiter,
  upload.array('files', 10),
  uploadController.uploadMultiple
);

// Upload employee avatar
router.post(
  '/employee/:employeeId/avatar',
  uploadLimiter,
  uploadImage.single('avatar'),
  requireCompanyAdmin,
  uploadController.uploadEmployeeAvatar
);

// Upload company logo
router.post(
  '/company/:companyId/logo',
  uploadLimiter,
  uploadImage.single('logo'),
  requireCompanyAdmin,
  uploadController.uploadCompanyLogo
);

// Delete file
router.delete('/:publicId', requireCompanyAdmin, uploadController.deleteFile);

export default router;