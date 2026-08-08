import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { authMiddleware, requireAttendanceOfficer, requireHRManager } from '../middleware/authMiddleware';

const router = Router();
const leaveController = new LeaveController();

// All routes require authentication
router.use(authMiddleware);

// Get all leave requests
router.get('/', requireAttendanceOfficer, leaveController.getAllLeaveRequests);

// Get leave stats
router.get('/stats', requireAttendanceOfficer, leaveController.getLeaveStats);

// Get employee leave balance
router.get('/balance/:employeeId', requireAttendanceOfficer, leaveController.getEmployeeLeaveBalance);

// Get leave request by ID
router.get('/:id', requireAttendanceOfficer, leaveController.getLeaveRequestById);

// Create leave request
router.post('/', authMiddleware, leaveController.createLeaveRequest);

// Update leave request
router.put('/:id', authMiddleware, leaveController.updateLeaveRequest);

// Approve leave request
router.post('/:id/approve', requireHRManager, leaveController.approveLeaveRequest);

// Reject leave request
router.post('/:id/reject', requireHRManager, leaveController.rejectLeaveRequest);

// Cancel leave request
router.post('/:id/cancel', authMiddleware, leaveController.cancelLeaveRequest);

// Delete leave request
router.delete('/:id', requireHRManager, leaveController.deleteLeaveRequest);

export default router;