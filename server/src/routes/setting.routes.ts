import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller';
import { authMiddleware, requireCompanyAdmin, requireSuperAdmin } from '../middleware/authMiddleware';

const router = Router();
const settingController = new SettingController();

// All routes require authentication
router.use(authMiddleware);

// Get public settings (accessible to all authenticated users)
router.get('/public', settingController.getPublicSettings);

// Get all settings
router.get('/', requireCompanyAdmin, settingController.getAllSettings);

// Get setting by key
router.get('/:key', requireCompanyAdmin, settingController.getSettingByKey);

// Create setting
router.post('/', requireSuperAdmin, settingController.createSetting);

// Update setting
router.put('/:key', requireCompanyAdmin, settingController.updateSetting);

// Delete setting
router.delete('/:key', requireSuperAdmin, settingController.deleteSetting);

export default router;