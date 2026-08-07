import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId, period } = req.query;
      const data = await this.dashboardService.getOverview({
        companyId: companyId as string,
        branchId: branchId as string,
        period: period as string || 'month',
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getAttendanceChart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId, startDate, endDate } = req.query;
      const data = await this.dashboardService.getAttendanceChart({
        companyId: companyId as string,
        branchId: branchId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getDepartmentStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId } = req.query;
      const data = await this.dashboardService.getDepartmentStats({
        companyId: companyId as string,
        branchId: branchId as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId, limit } = req.query;
      const data = await this.dashboardService.getRecentActivity({
        companyId: companyId as string,
        branchId: branchId as string,
        limit: limit ? parseInt(limit as string) : 10,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getLeaveStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId } = req.query;
      const data = await this.dashboardService.getLeaveStats({
        companyId: companyId as string,
        branchId: branchId as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId } = req.query;
      const data = await this.dashboardService.getEmployeeStats({
        companyId: companyId as string,
        branchId: branchId as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}