import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authMiddleware, requireCompanyAdmin, requireHRManager, requireStaff } from '../middleware/authMiddleware';

const router = Router();
const employeeController = new EmployeeController();

// All routes require authentication
router.use(authMiddleware);

// ---- Read endpoints (all authenticated users) ----
// STAFF sees only their own data; others see appropriate data via service
router.get('/', requireStaff, employeeController.getAllEmployees);
router.get('/by-employee-id/:employeeId', requireStaff, employeeController.getEmployeeByEmployeeId);
router.get('/:id/attendance', requireStaff, employeeController.getEmployeeAttendance);
router.get('/:id/leave-requests', requireStaff, employeeController.getEmployeeLeaveRequests);
router.get('/:id/id-card', requireStaff, employeeController.getEmployeeIDCard);
router.get('/:id', requireStaff, employeeController.getEmployeeById);

// ---- Write endpoints ----
// STAFF can upload their own avatar and update their own info
router.post('/:id/avatar', requireStaff, employeeController.uploadAvatar);
router.put('/:id', requireStaff, employeeController.updateEmployee);

// ---- Admin-only endpoints ----
router.post('/:id/generate-id-card', requireHRManager, employeeController.generateIDCard);
router.post('/', requireHRManager, employeeController.createEmployee);
router.delete('/:id', requireCompanyAdmin, employeeController.deleteEmployee);
router.patch('/:id/status', requireHRManager, employeeController.updateEmployeeStatus);

export default router;