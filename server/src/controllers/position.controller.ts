import { Request, Response, NextFunction } from 'express';
import { PositionService } from '../services/position.service';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export class PositionController {
  private positionService: PositionService;

  constructor() {
    this.positionService = new PositionService();
  }

  getAllPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, companyId, departmentId, isActive } = req.query;
      const result = await this.positionService.getAllPositions({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        companyId: companyId as string,
        departmentId: departmentId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result.positions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getPositionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const position = await this.positionService.getPositionById(id, req.userId!);
      res.status(200).json({
        success: true,
        data: position,
      });
    } catch (error) {
      next(error);
    }
  };

  createPosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const positionData = req.body;
      const newPosition = await this.positionService.createPosition(positionData, req.userId!);
      res.status(201).json({
        success: true,
        message: 'Position created successfully',
        data: newPosition,
      });
    } catch (error) {
      next(error);
    }
  };

  updatePosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const positionData = req.body;
      const updatedPosition = await this.positionService.updatePosition(id, positionData, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Position updated successfully',
        data: updatedPosition,
      });
    } catch (error) {
      next(error);
    }
  };

  deletePosition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.positionService.deletePosition(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Position deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updatePositionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updatedPosition = await this.positionService.updatePositionStatus(id, isActive, req.userId!);
      res.status(200).json({
        success: true,
        message: `Position ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedPosition,
      });
    } catch (error) {
      next(error);
    }
  };

  getPositionEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page, limit, search } = req.query;
      const result = await this.positionService.getPositionEmployees(id, {
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
}