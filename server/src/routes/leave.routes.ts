import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { authMiddleware, requireHRManager, requireStaff } from '../middleware/authMiddleware';

const router = Router();
const leaveController = new LeaveController();

// All routes require authentication
router.use(authMiddleware);

// ---- Read endpoints (all authenticated users) ----
router.get('/', requireStaff, leaveController.getAllLeaveRequests);
router.get('/stats', requireStaff, leaveController.getLeaveStats);
router.get('/balance/:employeeId', requireStaff, leaveController.getEmployeeLeaveBalance);
router.get('/:id', requireStaff, leaveController.getLeaveRequestById);

// ---- Write endpoints ----
// STAFF can create and cancel their own leave requests
router.post('/', requireStaff, leaveController.createLeaveRequest);
router.put('/:id', requireStaff, leaveController.updateLeaveRequest);
router.post('/:id/cancel', requireStaff, leaveController.cancelLeaveRequest);

// ---- Admin-only endpoints ----
router.post('/:id/approve', requireHRManager, leaveController.approveLeaveRequest);
router.post('/:id/reject', requireHRManager, leaveController.rejectLeaveRequest);
router.delete('/:id', requireHRManager, leaveController.deleteLeaveRequest);

export default router;