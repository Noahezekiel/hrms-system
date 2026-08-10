import { Request, Response, NextFunction } from 'express';
import { HolidayService } from '../services/holiday.service';

export class HolidayController {
  private holidayService: HolidayService;

  constructor() {
    this.holidayService = new HolidayService();
  }

  getAllHolidays = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, companyId, branchId, year, isRecurring } = req.query;
      const result = await this.holidayService.getAllHolidays({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        companyId: companyId as string,
        branchId: branchId as string,
        year: year ? parseInt(year as string) : undefined,
        isRecurring: isRecurring === 'true' ? true : isRecurring === 'false' ? false : undefined,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result.holidays,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getHolidayById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const holiday = await this.holidayService.getHolidayById(id, req.userId!);
      res.status(200).json({
        success: true,
        data: holiday,
      });
    } catch (error) {
      next(error);
    }
  };

  createHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const holidayData = req.body;
      const newHoliday = await this.holidayService.createHoliday(holidayData, req.userId!);
      res.status(201).json({
        success: true,
        message: 'Holiday created successfully',
        data: newHoliday,
      });
    } catch (error) {
      next(error);
    }
  };

  updateHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const holidayData = req.body;
      const updatedHoliday = await this.holidayService.updateHoliday(id, holidayData, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Holiday updated successfully',
        data: updatedHoliday,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.holidayService.deleteHoliday(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Holiday deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getHolidaysByDateRange = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, companyId, branchId } = req.query;
      const holidays = await this.holidayService.getHolidaysByDateRange({
        startDate: startDate as string,
        endDate: endDate as string,
        companyId: companyId as string,
        branchId: branchId as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: holidays,
      });
    } catch (error) {
      next(error);
    }
  };

  checkHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date, companyId, branchId } = req.query;
      const isHoliday = await this.holidayService.checkHoliday({
        date: date as string,
        companyId: companyId as string,
        branchId: branchId as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: isHoliday,
      });
    } catch (error) {
      next(error);
    }
  };
}