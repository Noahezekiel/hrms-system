import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { authMiddleware, requireSuperAdmin, requireCompanyAdmin } from '../middleware/authMiddleware';

const router = Router();
const companyController = new CompanyController();

// All routes require authentication
router.use(authMiddleware);

// Get all companies
router.get('/', requireSuperAdmin, companyController.getAllCompanies);

// Get company branches
router.get('/:id/branches', requireCompanyAdmin, companyController.getCompanyBranches);

// Get company departments
router.get('/:id/departments', requireCompanyAdmin, companyController.getCompanyDepartments);

// Get company employees
router.get('/:id/employees', requireCompanyAdmin, companyController.getCompanyEmployees);

// Get company by ID
router.get('/:id', requireCompanyAdmin, companyController.getCompanyById);

// Create company
router.post('/', requireSuperAdmin, companyController.createCompany);

// Update company
router.put('/:id', requireCompanyAdmin, companyController.updateCompany);

// Delete company
router.delete('/:id', requireSuperAdmin, companyController.deleteCompany);

// Update company status
router.patch('/:id/status', requireCompanyAdmin, companyController.updateCompanyStatus);

export default router;