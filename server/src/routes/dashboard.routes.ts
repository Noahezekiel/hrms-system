import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware, requireStaff } from '../middleware/authMiddleware';

const router = Router();
const dashboardController = new DashboardController();

// All routes require authentication
router.use(authMiddleware);

// All dashboard endpoints use requireStaff (allows any authenticated user)
// Service layer filters data based on role
router.get('/overview', requireStaff, dashboardController.getOverview);
router.get('/attendance-chart', requireStaff, dashboardController.getAttendanceChart);
router.get('/department-stats', requireStaff, dashboardController.getDepartmentStats);
router.get('/recent-activity', requireStaff, dashboardController.getRecentActivity);
router.get('/leave-stats', requireStaff, dashboardController.getLeaveStats);
router.get('/employee-stats', requireStaff, dashboardController.getEmployeeStats);

export default router;