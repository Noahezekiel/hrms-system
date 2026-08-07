import { Router } from 'express';
import { ShiftController } from '../controllers/shift.controller';
import { authMiddleware, requireHRManager, requireCompanyAdmin } from '../middleware/authMiddleware';

const router = Router();
const shiftController = new ShiftController();

// All routes require authentication
router.use(authMiddleware);

// Get all shifts
router.get('/', requireHRManager, shiftController.getAllShifts);

// Get shift employees
router.get('/:id/employees', requireHRManager, shiftController.getShiftEmployees);

// Get shift by ID
router.get('/:id', requireHRManager, shiftController.getShiftById);

// Get employee shifts (by employee ID)
router.get('/employee/:employeeId', requireHRManager, shiftController.getEmployeeShifts);

// Create shift
router.post('/', requireCompanyAdmin, shiftController.createShift);

// Assign shift to employee
router.post('/:id/assign', requireHRManager, shiftController.assignShiftToEmployee);

// Update shift
router.put('/:id', requireCompanyAdmin, shiftController.updateShift);

// Remove shift from employee
router.delete('/:id/remove', requireHRManager, shiftController.removeShiftFromEmployee);

// Delete shift
router.delete('/:id', requireCompanyAdmin, shiftController.deleteShift);

// Update shift status
router.patch('/:id/status', requireCompanyAdmin, shiftController.updateShiftStatus);

export default router;