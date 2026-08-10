import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authMiddleware, requireCompanyAdmin, requireHRManager, requireStaff, requireAttendanceOfficer } from '../middleware/authMiddleware';

const router = Router();
const employeeController = new EmployeeController();

// All routes require authentication
router.use(authMiddleware);

// Get all employees (with filters)
router.get('/', requireHRManager, employeeController.getAllEmployees);

// Get employee by employee ID (custom ID)
router.get('/by-employee-id/:employeeId', requireHRManager, employeeController.getEmployeeByEmployeeId);

// Get employee attendance
router.get('/:id/attendance', requireAttendanceOfficer, employeeController.getEmployeeAttendance);

// Get employee leave requests
router.get('/:id/leave-requests', requireAttendanceOfficer, employeeController.getEmployeeLeaveRequests);

// Get employee ID card
router.get('/:id/id-card', requireHRManager, employeeController.getEmployeeIDCard);

// Generate employee ID card
router.post('/:id/generate-id-card', requireHRManager, employeeController.generateIDCard);

// Upload employee avatar
router.post('/:id/avatar', requireHRManager, employeeController.uploadAvatar);

// Get employee by ID
router.get('/:id', requireStaff, employeeController.getEmployeeById);

// Create employee
router.post('/', requireHRManager, employeeController.createEmployee);

// Update employee
router.put('/:id', requireHRManager, employeeController.updateEmployee);

// Delete employee
router.delete('/:id', requireCompanyAdmin, employeeController.deleteEmployee);

// Update employee status
router.patch('/:id/status', requireHRManager, employeeController.updateEmployeeStatus);

export default router;