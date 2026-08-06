import { Request, Response, NextFunction } from 'express';
import { LeaveService } from '../services/leave.service';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export class LeaveController {
  private leaveService: LeaveService;

  constructor() {
    this.leaveService = new LeaveService();
  }

  getAllLeaveRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, employeeId, companyId, branchId, departmentId, status, leaveType, startDate, endDate } = req.query;
      const result = await this.leaveService.getAllLeaveRequests({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        employeeId: employeeId as string,
        companyId: companyId as string,
        branchId: branchId as string,
        departmentId: departmentId as string,
        status: status as string,
        leaveType: leaveType as string,
        startDate: startDate as string,
        endDate: endDate as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result.leaveRequests,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error) {
      next(error);
    }
  };

  getLeaveRequestById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const leaveRequest = await this.leaveService.getLeaveRequestById(id, req.userId!);
      res.status(200).json({
        success: true,
        data: leaveRequest,
      });
    } catch (error) {
      next(error);
    }
  };

  createLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leaveData = req.body;
      const newLeave = await this.leaveService.createLeaveRequest(leaveData, req.userId!);
      res.status(201).json({
        success: true,
        message: 'Leave request created successfully',
        data: newLeave,
      });
    } catch (error) {
      next(error);
    }
  };

  updateLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const leaveData = req.body;
      const updated = await this.leaveService.updateLeaveRequest(id, leaveData, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Leave request updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  approveLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { approvedBy, notes } = req.body;
      const result = await this.leaveService.approveLeaveRequest(id, approvedBy, notes, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Leave request approved',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  rejectLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { rejectedReason } = req.body;
      const result = await this.leaveService.rejectLeaveRequest(id, rejectedReason, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Leave request rejected',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  cancelLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.leaveService.cancelLeaveRequest(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Leave request cancelled',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeLeaveBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const balance = await this.leaveService.getEmployeeLeaveBalance(employeeId, req.userId!);
      res.status(200).json({
        success: true,
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  };

  getLeaveStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId, departmentId, startDate, endDate } = req.query;
      const stats = await this.leaveService.getLeaveStats({
        companyId: companyId as string,
        branchId: branchId as string,
        departmentId: departmentId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.leaveService.deleteLeaveRequest(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Leave request deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}