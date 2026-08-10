import { Router } from 'express';
import { IDCardController } from '../controllers/idCard.controller';
import { authMiddleware, requireHRManager, requireCompanyAdmin } from '../middleware/authMiddleware';

const router = Router();
const idCardController = new IDCardController();

// All routes require authentication
router.use(authMiddleware);

// Get all ID cards
router.get('/', requireHRManager, idCardController.getAllIDCards);

// Download ID card as PDF or PNG
router.get('/:id/download', requireHRManager, idCardController.downloadIDCard);

// Get ID card by ID
router.get('/:id', requireHRManager, idCardController.getIDCardById);

// Get ID card by employee ID
router.get('/employee/:employeeId', requireHRManager, idCardController.getIDCardByEmployeeId);

// Generate new ID card
router.post('/generate', requireHRManager, idCardController.generateIDCard);

// Regenerate ID card
router.post('/:id/regenerate', requireHRManager, idCardController.regenerateIDCard);

// Update ID card status
router.patch('/:id/status', requireCompanyAdmin, idCardController.updateIDCardStatus);

// Delete ID card
router.delete('/:id', requireCompanyAdmin, idCardController.deleteIDCard);

export default router;