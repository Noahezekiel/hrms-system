import { Router } from 'express';
import { HolidayController } from '../controllers/holiday.controller';
import { authMiddleware, requireHRManager, requireCompanyAdmin } from '../middleware/authMiddleware';

const router = Router();
const holidayController = new HolidayController();

// All routes require authentication
router.use(authMiddleware);

// Get all holidays
router.get('/', requireHRManager, holidayController.getAllHolidays);

// Get holidays by date range
router.get('/range', requireHRManager, holidayController.getHolidaysByDateRange);

// Check if a date is a holiday
router.get('/check', requireHRManager, holidayController.checkHoliday);

// Get holiday by ID
router.get('/:id', requireHRManager, holidayController.getHolidayById);

// Create holiday
router.post('/', requireCompanyAdmin, holidayController.createHoliday);

// Update holiday
router.put('/:id', requireCompanyAdmin, holidayController.updateHoliday);

// Delete holiday
router.delete('/:id', requireCompanyAdmin, holidayController.deleteHoliday);

export default router;