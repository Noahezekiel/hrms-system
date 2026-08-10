import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware, requireCompanyAdmin, requireSuperAdmin } from '../middleware/authMiddleware';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authMiddleware);

// Get all users (with filters)
router.get('/', requireCompanyAdmin, userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create new user
router.post('/', requireCompanyAdmin, userController.createUser);

// Update user
router.put('/:id', requireCompanyAdmin, userController.updateUser);

// Delete user
router.delete('/:id', requireSuperAdmin, userController.deleteUser);

// Update user status (activate/deactivate)
router.patch('/:id/status', requireCompanyAdmin, userController.updateUserStatus);

export default router;