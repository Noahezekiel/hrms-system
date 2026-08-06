import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/department.service';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export class DepartmentController {
  private departmentService: DepartmentService;

  constructor() {
    this.departmentService = new DepartmentService();
  }

  getAllDepartments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, companyId, branchId, isActive } = req.query;
      const result = await this.departmentService.getAllDepartments({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        companyId: companyId as string,
        branchId: branchId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result.departments,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getDepartmentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const department = await this.departmentService.getDepartmentById(id, req.userId!);
      res.status(200).json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  };

  createDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentData = req.body;
      const newDepartment = await this.departmentService.createDepartment(departmentData, req.userId!);
      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: newDepartment,
      });
    } catch (error) {
      next(error);
    }
  };

  updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const departmentData = req.body;
      const updatedDepartment = await this.departmentService.updateDepartment(id, departmentData, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        data: updatedDepartment,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.departmentService.deleteDepartment(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateDepartmentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updatedDepartment = await this.departmentService.updateDepartmentStatus(id, isActive, req.userId!);
      res.status(200).json({
        success: true,
        message: `Department ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedDepartment,
      });
    } catch (error) {
      next(error);
    }
  };

  getDepartmentEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page, limit, search } = req.query;
      const result = await this.departmentService.getDepartmentEmployees(id, {
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

  getDepartmentPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const positions = await this.departmentService.getDepartmentPositions(id, req.userId!);
      res.status(200).json({
        success: true,
        data: positions,
      });
    } catch (error) {
      next(error);
    }
  };
}