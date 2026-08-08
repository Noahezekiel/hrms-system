import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware, requireCompanyAdmin } from '../middleware/authMiddleware';

const router = Router();
const dashboardController = new DashboardController();

// All routes require authentication
router.use(authMiddleware);

// Get dashboard overview
router.get('/overview', requireCompanyAdmin, dashboardController.getOverview);

// Get attendance chart data
router.get('/attendance-chart', requireCompanyAdmin, dashboardController.getAttendanceChart);

// Get department statistics
router.get('/department-stats', requireCompanyAdmin, dashboardController.getDepartmentStats);

// Get recent activity
router.get('/recent-activity', requireCompanyAdmin, dashboardController.getRecentActivity);

// Get leave statistics
router.get('/leave-stats', requireCompanyAdmin, dashboardController.getLeaveStats);

// Get employee statistics
router.get('/employee-stats', requireCompanyAdmin, dashboardController.getEmployeeStats);

export default router;