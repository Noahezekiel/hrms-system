import { Router } from 'express';
import { PositionController } from '../controllers/position.controller';
import { authMiddleware, requireCompanyAdmin, requireHRManager } from '../middleware/authMiddleware';

const router = Router();
const positionController = new PositionController();

// All routes require authentication
router.use(authMiddleware);

// Get all positions
router.get('/', requireCompanyAdmin, positionController.getAllPositions);

// Get position employees
router.get('/:id/employees', requireHRManager, positionController.getPositionEmployees);

// Get position by ID
router.get('/:id', requireCompanyAdmin, positionController.getPositionById);

// Create position
router.post('/', requireCompanyAdmin, positionController.createPosition);

// Update position
router.put('/:id', requireCompanyAdmin, positionController.updatePosition);

// Delete position
router.delete('/:id', requireCompanyAdmin, positionController.deletePosition);

// Update position status
router.patch('/:id/status', requireCompanyAdmin, positionController.updatePositionStatus);

export default router;