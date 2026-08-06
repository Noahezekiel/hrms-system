import { Request, Response, NextFunction } from 'express';
import { BranchService } from '../services/branch.service';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export class BranchController {
  private branchService: BranchService;

  constructor() {
    this.branchService = new BranchService();
  }

  getAllBranches = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, companyId, isActive } = req.query;
      const result = await this.branchService.getAllBranches({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        companyId: companyId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result.branches,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getBranchById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const branch = await this.branchService.getBranchById(id, req.userId!);
      res.status(200).json({
        success: true,
        data: branch,
      });
    } catch (error) {
      next(error);
    }
  };

  createBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const branchData = req.body;
      const newBranch = await this.branchService.createBranch(branchData, req.userId!);
      res.status(201).json({
        success: true,
        message: 'Branch created successfully',
        data: newBranch,
      });
    } catch (error) {
      next(error);
    }
  };

  updateBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const branchData = req.body;
      const updatedBranch = await this.branchService.updateBranch(id, branchData, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Branch updated successfully',
        data: updatedBranch,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.branchService.deleteBranch(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Branch deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateBranchStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updatedBranch = await this.branchService.updateBranchStatus(id, isActive, req.userId!);
      res.status(200).json({
        success: true,
        message: `Branch ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedBranch,
      });
    } catch (error) {
      next(error);
    }
  };

  getBranchDepartments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const departments = await this.branchService.getBranchDepartments(id, req.userId!);
      res.status(200).json({
        success: true,
        data: departments,
      });
    } catch (error) {
      next(error);
    }
  };

  getBranchEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page, limit, search } = req.query;
      const result = await this.branchService.getBranchEmployees(id, {
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