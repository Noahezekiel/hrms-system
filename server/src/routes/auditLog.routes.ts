import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLog.controller';
import { authMiddleware, requireSuperAdmin, requireCompanyAdmin } from '../middleware/authMiddleware';

const router = Router();
const auditLogController = new AuditLogController();

// All routes require authentication
router.use(authMiddleware);

// Get all audit logs
router.get('/', requireCompanyAdmin, auditLogController.getAllAuditLogs);

// Get audit log stats
router.get('/stats', requireCompanyAdmin, auditLogController.getAuditLogStats);

// Get audit log by ID
router.get('/:id', requireCompanyAdmin, auditLogController.getAuditLogById);

// Get audit logs by entity
router.get('/entity/:entity/:entityId', requireCompanyAdmin, auditLogController.getAuditLogsByEntity);

// Clear old audit logs (Super Admin only)
router.post('/clear', requireSuperAdmin, auditLogController.clearOldAuditLogs);

export default router;