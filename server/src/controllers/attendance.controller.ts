import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service';

export class AttendanceController {
  private attendanceService: AttendanceService;

  constructor() {
    this.attendanceService = new AttendanceService();
  }

  getAllAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, employeeId, companyId, branchId, departmentId, startDate, endDate, status } = req.query;
      const result = await this.attendanceService.getAllAttendance({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        employeeId: employeeId as string,
        companyId: companyId as string,
        branchId: branchId as string,
        departmentId: departmentId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        status: status as string,
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

  getAttendanceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const attendance = await this.attendanceService.getAttendanceById(id, req.userId!);
      res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  };

  checkIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, photo, note, latitude, longitude } = req.body;
      const result = await this.attendanceService.checkIn({
        employeeId,
        photo,
        note,
        latitude,
        longitude,
        userId: req.userId!,
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
      res.status(200).json({
        success: true,
        message: 'Check-in successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  checkOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, photo, note, latitude, longitude } = req.body;
      const result = await this.attendanceService.checkOut({
        employeeId,
        photo,
        note,
        latitude,
        longitude,
        userId: req.userId!,
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
      res.status(200).json({
        success: true,
        message: 'Check-out successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  breakIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, photo, note } = req.body;
      const result = await this.attendanceService.breakIn({
        employeeId,
        photo,
        note,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        message: 'Break-in successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  breakOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, photo, note } = req.body;
      const result = await this.attendanceService.breakOut({
        employeeId,
        photo,
        note,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        message: 'Break-out successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getTodayAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, companyId, branchId } = req.query;
      const result = await this.attendanceService.getTodayAttendance({
        employeeId: employeeId as string,
        companyId: companyId as string,
        branchId: branchId as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeAttendanceSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;
      const summary = await this.attendanceService.getEmployeeAttendanceSummary({
        employeeId,
        startDate: startDate as string,
        endDate: endDate as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  getAttendanceStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, branchId, startDate, endDate } = req.query;
      const stats = await this.attendanceService.getAttendanceStats({
        companyId: companyId as string,
        branchId: branchId as string,
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

  manualAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, date, checkIn, checkOut, breakIn, breakOut, status, notes } = req.body;
      const result = await this.attendanceService.manualAttendance({
        employeeId,
        date,
        checkIn,
        checkOut,
        breakIn,
        breakOut,
        status,
        notes,
        userId: req.userId!,
      });
      res.status(201).json({
        success: true,
        message: 'Manual attendance recorded',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = await this.attendanceService.updateAttendance(id, data, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.attendanceService.deleteAttendance(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Attendance record deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  markOvertime = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { overtimeHours, notes } = req.body;
      const result = await this.attendanceService.markOvertime(id, overtimeHours, notes, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Overtime marked successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getOvertimeReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, companyId, branchId, departmentId } = req.query;
      const result = await this.attendanceService.getOvertimeReport({
        startDate: startDate as string,
        endDate: endDate as string,
        companyId: companyId as string,
        branchId: branchId as string,
        departmentId: departmentId as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}