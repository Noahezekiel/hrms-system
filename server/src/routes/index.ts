import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import companyRoutes from './company.routes';
import branchRoutes from './branch.routes';
import departmentRoutes from './department.routes';
import positionRoutes from './position.routes';
import employeeRoutes from './employee.routes';
import shiftRoutes from './shift.routes';
import attendanceRoutes from './attendance.routes';
import leaveRoutes from './leave.routes';
import holidayRoutes from './holiday.routes';
import idCardRoutes from './idCard.routes';
import reportRoutes from './report.routes';
import auditLogRoutes from './auditLog.routes';
import settingRoutes from './setting.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';
import uploadRoutes from './upload.routes';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/branches', branchRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);
router.use('/employees', employeeRoutes);
router.use('/shifts', shiftRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leave', leaveRoutes);
router.use('/holidays', holidayRoutes);
router.use('/id-cards', idCardRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/settings', settingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);

export default router;