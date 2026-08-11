import { Router } from 'express';
import { BranchController } from '../controllers/branch.controller';
import { authMiddleware, requireCompanyAdmin } from '../middleware/authMiddleware';

const router = Router();
const branchController = new BranchController();

// All routes require authentication
router.use(authMiddleware);

// Get all branches
router.get('/', requireCompanyAdmin, branchController.getAllBranches);

// Get branch departments
router.get('/:id/departments', requireCompanyAdmin, branchController.getBranchDepartments);

// Get branch employees
router.get('/:id/employees', requireCompanyAdmin, branchController.getBranchEmployees);

// Get branch by ID
router.get('/:id', requireCompanyAdmin, branchController.getBranchById);

// Create branch
router.post('/', requireCompanyAdmin, branchController.createBranch);

// Update branch
router.put('/:id', requireCompanyAdmin, branchController.updateBranch);

// Delete branch
router.delete('/:id', requireCompanyAdmin, branchController.deleteBranch);

// Update branch status
router.patch('/:id/status', requireCompanyAdmin, branchController.updateBranchStatus);

export default router;