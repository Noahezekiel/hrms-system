import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/auditLog.service';

export class AuditLogController {
  private auditLogService: AuditLogService;

  constructor() {
    this.auditLogService = new AuditLogService();
  }

  getAllAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, userId, companyId, branchId, action, entity, startDate, endDate } = req.query;
      const result = await this.auditLogService.getAllAuditLogs({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        userId: userId as string,
        companyId: companyId as string,
        branchId: branchId as string,
        action: action as string,
        entity: entity as string,
        startDate: startDate as string,
        endDate: endDate as string,
        currentUserId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result.auditLogs,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getAuditLogById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const auditLog = await this.auditLogService.getAuditLogById(id, req.userId!);
      res.status(200).json({
        success: true,
        data: auditLog,
      });
    } catch (error) {
      next(error);
    }
  };

  getAuditLogsByEntity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entity, entityId } = req.params;
      const { page, limit } = req.query;
      const result = await this.auditLogService.getAuditLogsByEntity({
        entity,
        entityId,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        currentUserId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result.auditLogs,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getAuditLogStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, startDate, endDate } = req.query;
      const stats = await this.auditLogService.getAuditLogStats({
        companyId: companyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        currentUserId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  clearOldAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { days } = req.body;
      const result = await this.auditLogService.clearOldAuditLogs({
        days: days || 90,
        currentUserId: req.userId!,
      });
      res.status(200).json({
        success: true,
        message: `Cleared ${result.count} audit logs older than ${days || 90} days`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}