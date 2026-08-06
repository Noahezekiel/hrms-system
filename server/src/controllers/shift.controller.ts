import { Request, Response, NextFunction } from 'express';
import { ShiftService } from '../services/shift.service';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export class ShiftController {
  private shiftService: ShiftService;

  constructor() {
    this.shiftService = new ShiftService();
  }

  getAllShifts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, companyId, branchId, isActive } = req.query;
      const result = await this.shiftService.getAllShifts({
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
        data: result.shifts,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getShiftById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const shift = await this.shiftService.getShiftById(id, req.userId!);
      res.status(200).json({
        success: true,
        data: shift,
      });
    } catch (error) {
      next(error);
    }
  };

  createShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shiftData = req.body;
      const newShift = await this.shiftService.createShift(shiftData, req.userId!);
      res.status(201).json({
        success: true,
        message: 'Shift created successfully',
        data: newShift,
      });
    } catch (error) {
      next(error);
    }
  };

  updateShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const shiftData = req.body;
      const updatedShift = await this.shiftService.updateShift(id, shiftData, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Shift updated successfully',
        data: updatedShift,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.shiftService.deleteShift(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Shift deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateShiftStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updatedShift = await this.shiftService.updateShiftStatus(id, isActive, req.userId!);
      res.status(200).json({
        success: true,
        message: `Shift ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedShift,
      });
    } catch (error) {
      next(error);
    }
  };

  assignShiftToEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { employeeId, startDate, endDate } = req.body;
      const assignment = await this.shiftService.assignShiftToEmployee(
        id,
        employeeId,
        startDate,
        endDate,
        req.userId!
      );
      res.status(201).json({
        success: true,
        message: 'Shift assigned to employee successfully',
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  };

  removeShiftFromEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { employeeId } = req.body;
      await this.shiftService.removeShiftFromEmployee(id, employeeId, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Shift removed from employee successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getShiftEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page, limit, search } = req.query;
      const result = await this.shiftService.getShiftEmployees(id, {
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

  getEmployeeShifts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const shifts = await this.shiftService.getEmployeeShifts(employeeId, req.userId!);
      res.status(200).json({
        success: true,
        data: shifts,
      });
    } catch (error) {
      next(error);
    }
  };
}