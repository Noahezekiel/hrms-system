import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { authMiddleware, requireCompanyAdmin, requireHRManager } from '../middleware/authMiddleware';

const router = Router();
const departmentController = new DepartmentController();

// All routes require authentication
router.use(authMiddleware);

// Get all departments
router.get('/', requireCompanyAdmin, departmentController.getAllDepartments);

// Get department employees
router.get('/:id/employees', requireHRManager, departmentController.getDepartmentEmployees);

// Get department positions
router.get('/:id/positions', requireHRManager, departmentController.getDepartmentPositions);

// Get department by ID
router.get('/:id', requireCompanyAdmin, departmentController.getDepartmentById);

// Create department
router.post('/', requireCompanyAdmin, departmentController.createDepartment);

// Update department
router.put('/:id', requireCompanyAdmin, departmentController.updateDepartment);

// Delete department
router.delete('/:id', requireCompanyAdmin, departmentController.deleteDepartment);

// Update department status
router.patch('/:id/status', requireCompanyAdmin, departmentController.updateDepartmentStatus);

export default router;