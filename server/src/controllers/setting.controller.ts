import { Request, Response, NextFunction } from 'express';
import { SettingService } from '../services/setting.service';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export class SettingController {
  private settingService: SettingService;

  constructor() {
    this.settingService = new SettingService();
  }

  getAllSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, companyId, isPublic } = req.query;
      const settings = await this.settingService.getAllSettings({
        category: category as string,
        companyId: companyId as string,
        isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

  getSettingByKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const setting = await this.settingService.getSettingByKey(key, req.userId!);
      res.status(200).json({
        success: true,
        data: setting,
      });
    } catch (error) {
      next(error);
    }
  };

  createSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settingData = req.body;
      const newSetting = await this.settingService.createSetting(settingData, req.userId!);
      res.status(201).json({
        success: true,
        message: 'Setting created successfully',
        data: newSetting,
      });
    } catch (error) {
      next(error);
    }
  };

  updateSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const settingData = req.body;
      const updatedSetting = await this.settingService.updateSetting(key, settingData, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Setting updated successfully',
        data: updatedSetting,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      await this.settingService.deleteSetting(key, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Setting deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getPublicSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.query;
      const settings = await this.settingService.getPublicSettings({
        companyId: companyId as string,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };
}