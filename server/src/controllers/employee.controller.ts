import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export class EmployeeController {
  private employeeService: EmployeeService;

  constructor() {
    this.employeeService = new EmployeeService();
  }

  getAllEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, companyId, branchId, departmentId, positionId, isActive } = req.query;
      const result = await this.employeeService.getAllEmployees({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        companyId: companyId as string,
        branchId: branchId as string,
        departmentId: departmentId as string,
        positionId: positionId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
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

  getEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const employee = await this.employeeService.getEmployeeById(id, req.userId!);
      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeByEmployeeId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const employee = await this.employeeService.getEmployeeByEmployeeId(employeeId, req.userId!);
      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  };

  createEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeData = req.body;
      const newEmployee = await this.employeeService.createEmployee(employeeData, req.userId!);
      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: newEmployee,
      });
    } catch (error) {
      next(error);
    }
  };

  updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const employeeData = req.body;
      const updatedEmployee = await this.employeeService.updateEmployee(id, employeeData, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: updatedEmployee,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.employeeService.deleteEmployee(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Employee deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateEmployeeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updatedEmployee = await this.employeeService.updateEmployeeStatus(id, isActive, req.userId!);
      res.status(200).json({
        success: true,
        message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedEmployee,
      });
    } catch (error) {
      next(error);
    }
  };

  uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { avatar } = req.body;
      const updatedEmployee = await this.employeeService.uploadAvatar(id, avatar, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: updatedEmployee,
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { startDate, endDate, page, limit } = req.query;
      const result = await this.employeeService.getEmployeeAttendance(id, {
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result.attendance,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeLeaveRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page, limit, status } = req.query;
      const result = await this.employeeService.getEmployeeLeaveRequests(id, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        status: status as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result.leaveRequests,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  generateIDCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const idCard = await this.employeeService.generateIDCard(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'ID Card generated successfully',
        data: idCard,
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeIDCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const idCard = await this.employeeService.getEmployeeIDCard(id, req.userId!);
      res.status(200).json({
        success: true,
        data: idCard,
      });
    } catch (error) {
      next(error);
    }
  };
}