import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authMiddleware, requireHRManager, requireStaff } from '../middleware/authMiddleware';

const router = Router();
const attendanceController = new AttendanceController();

// All routes require authentication
router.use(authMiddleware);

// ---- Read endpoints (accessible by all authenticated users) ----
// STAFF sees only their own data via service layer filtering
router.get('/', requireStaff, attendanceController.getAllAttendance);
router.get('/today', requireStaff, attendanceController.getTodayAttendance);
router.get('/stats', requireStaff, attendanceController.getAttendanceStats);
router.get('/employee/:employeeId/summary', requireStaff, attendanceController.getEmployeeAttendanceSummary);
router.get('/:id', requireStaff, attendanceController.getAttendanceById);

// ---- Write endpoints ----
// Check-in/out, break in/out – STAFF can do for themselves
router.post('/check-in', requireStaff, attendanceController.checkIn);
router.post('/check-out', requireStaff, attendanceController.checkOut);
router.post('/break-in', requireStaff, attendanceController.breakIn);
router.post('/break-out', requireStaff, attendanceController.breakOut);

// ---- Admin-only endpoints ----
router.get('/overtime', requireHRManager, attendanceController.getOvertimeReport);
router.post('/manual', requireHRManager, attendanceController.manualAttendance);
router.put('/:id', requireHRManager, attendanceController.updateAttendance);
router.post('/:id/overtime', requireHRManager, attendanceController.markOvertime);
router.delete('/:id', requireHRManager, attendanceController.deleteAttendance);

export default router;