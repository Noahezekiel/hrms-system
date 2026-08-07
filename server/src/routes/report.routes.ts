import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware, requireHRManager } from '../middleware/authMiddleware';

const router = Router();
const reportController = new ReportController();

// All routes require authentication and HR Manager role
router.use(authMiddleware);
router.use(requireHRManager);

// Attendance report
router.get('/attendance', reportController.getAttendanceReport);

// Leave report
router.get('/leave', reportController.getLeaveReport);

// Employee report
router.get('/employees', reportController.getEmployeeReport);

// Overtime report
router.get('/overtime', reportController.getOvertimeReport);

// Holiday report
router.get('/holidays', reportController.getHolidayReport);

export default router;