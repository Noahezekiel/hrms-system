import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';

export class ReportController {
  private reportService: ReportService;

  constructor() {
    this.reportService = new ReportService();
  }

  getAttendanceReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId, departmentId, startDate, endDate, format } = req.query;
      const report = await this.reportService.getAttendanceReport({
        companyId: companyId as string,
        branchId: branchId as string,
        departmentId: departmentId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        format: format as string || 'json',
        userId: req.userId!,
      });
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(report);
      } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(report);
      } else {
        res.status(200).json({
          success: true,
          data: report,
        });
      }
    } catch (error) {
      next(error);
    }
  };

  getLeaveReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId, departmentId, startDate, endDate, format } = req.query;
      const report = await this.reportService.getLeaveReport({
        companyId: companyId as string,
        branchId: branchId as string,
        departmentId: departmentId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        format: format as string || 'json',
        userId: req.userId!,
      });
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="leave-report-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(report);
      } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="leave-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(report);
      } else {
        res.status(200).json({
          success: true,
          data: report,
        });
      }
    } catch (error) {
      next(error);
    }
  };

  getEmployeeReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId, departmentId, isActive, format } = req.query;
      const report = await this.reportService.getEmployeeReport({
        companyId: companyId as string,
        branchId: branchId as string,
        departmentId: departmentId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        format: format as string || 'json',
        userId: req.userId!,
      });
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="employee-report-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(report);
      } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="employee-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(report);
      } else {
        res.status(200).json({
          success: true,
          data: report,
        });
      }
    } catch (error) {
      next(error);
    }
  };

  getOvertimeReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId, departmentId, startDate, endDate, format } = req.query;
      const report = await this.reportService.getOvertimeReport({
        companyId: companyId as string,
        branchId: branchId as string,
        departmentId: departmentId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        format: format as string || 'json',
        userId: req.userId!,
      });
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="overtime-report-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(report);
      } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="overtime-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(report);
      } else {
        res.status(200).json({
          success: true,
          data: report,
        });
      }
    } catch (error) {
      next(error);
    }
  };

  getHolidayReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId, year, format } = req.query;
      const report = await this.reportService.getHolidayReport({
        companyId: companyId as string,
        branchId: branchId as string,
        year: year ? parseInt(year as string) : undefined,
        format: format as string || 'json',
        userId: req.userId!,
      });
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="holiday-report-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(report);
      } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="holiday-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(report);
      } else {
        res.status(200).json({
          success: true,
          data: report,
        });
      }
    } catch (error) {
      next(error);
    }
  };
}