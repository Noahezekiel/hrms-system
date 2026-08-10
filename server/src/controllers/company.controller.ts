import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/company.service';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  getAllCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, isActive } = req.query;
      const result = await this.companyService.getAllCompanies({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result.companies,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const company = await this.companyService.getCompanyById(id, req.userId!);
      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  };

  createCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyData = req.body;
      const newCompany = await this.companyService.createCompany(companyData, req.userId!);
      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: newCompany,
      });
    } catch (error) {
      next(error);
    }
  };

  updateCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyData = req.body;
      const updatedCompany = await this.companyService.updateCompany(id, companyData, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Company updated successfully',
        data: updatedCompany,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.companyService.deleteCompany(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Company deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateCompanyStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updatedCompany = await this.companyService.updateCompanyStatus(id, isActive, req.userId!);
      res.status(200).json({
        success: true,
        message: `Company ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedCompany,
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanyBranches = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const branches = await this.companyService.getCompanyBranches(id, req.userId!);
      res.status(200).json({
        success: true,
        data: branches,
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanyDepartments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const departments = await this.companyService.getCompanyDepartments(id, req.userId!);
      res.status(200).json({
        success: true,
        data: departments,
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanyEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page, limit, search } = req.query;
      const result = await this.companyService.getCompanyEmployees(id, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result.employees,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };
}