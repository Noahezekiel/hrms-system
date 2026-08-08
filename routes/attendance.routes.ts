import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authMiddleware, requireAttendanceOfficer, requireHRManager } from '../middleware/authMiddleware';

const router = Router();
const attendanceController = new AttendanceController();

// All routes require authentication
router.use(authMiddleware);

// Get all attendance records
router.get('/', requireAttendanceOfficer, attendanceController.getAllAttendance);

// Get today's attendance
router.get('/today', requireAttendanceOfficer, attendanceController.getTodayAttendance);

// Get attendance stats
router.get('/stats', requireAttendanceOfficer, attendanceController.getAttendanceStats);

// Get employee attendance summary
router.get('/employee/:employeeId/summary', requireAttendanceOfficer, attendanceController.getEmployeeAttendanceSummary);

// Get overtime report
router.get('/overtime', requireHRManager, attendanceController.getOvertimeReport);

// Check in
router.post('/check-in', requireAttendanceOfficer, attendanceController.checkIn);

// Check out
router.post('/check-out', requireAttendanceOfficer, attendanceController.checkOut);

// Break in
router.post('/break-in', requireAttendanceOfficer, attendanceController.breakIn);

// Break out
router.post('/break-out', requireAttendanceOfficer, attendanceController.breakOut);

// Manual attendance (admin)
router.post('/manual', requireHRManager, attendanceController.manualAttendance);

// Get attendance by ID
router.get('/:id', requireAttendanceOfficer, attendanceController.getAttendanceById);

// Update attendance
router.put('/:id', requireHRManager, attendanceController.updateAttendance);

// Mark overtime
router.post('/:id/overtime', requireHRManager, attendanceController.markOvertime);

// Delete attendance
router.delete('/:id', requireHRManager, attendanceController.deleteAttendance);

export default router;