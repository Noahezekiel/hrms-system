import { Request, Response, NextFunction } from 'express';
import { IDCardService } from '../services/idCard.service';

export class IDCardController {
  private idCardService: IDCardService;

  constructor() {
    this.idCardService = new IDCardService();
  }

  getAllIDCards = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, companyId, branchId, departmentId, isActive } = req.query;
      const result = await this.idCardService.getAllIDCards({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        search: search as string,
        companyId: companyId as string,
        branchId: branchId as string,
        departmentId: departmentId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        userId: req.userId!,
      });
      res.status(200).json({
        success: true,
        data: result.idCards,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getIDCardById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const idCard = await this.idCardService.getIDCardById(id, req.userId!);
      res.status(200).json({
        success: true,
        data: idCard,
      });
    } catch (error) {
      next(error);
    }
  };

  getIDCardByEmployeeId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const idCard = await this.idCardService.getIDCardByEmployeeId(employeeId, req.userId!);
      res.status(200).json({
        success: true,
        data: idCard,
      });
    } catch (error) {
      next(error);
    }
  };

  generateIDCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.body;
      const idCard = await this.idCardService.generateIDCard(employeeId, req.userId!);
      res.status(201).json({
        success: true,
        message: 'ID Card generated successfully',
        data: idCard,
      });
    } catch (error) {
      next(error);
    }
  };

  regenerateIDCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const idCard = await this.idCardService.regenerateIDCard(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'ID Card regenerated successfully',
        data: idCard,
      });
    } catch (error) {
      next(error);
    }
  };

  updateIDCardStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updated = await this.idCardService.updateIDCardStatus(id, isActive, req.userId!);
      res.status(200).json({
        success: true,
        message: `ID Card ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteIDCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.idCardService.deleteIDCard(id, req.userId!);
      res.status(200).json({
        success: true,
        message: 'ID Card deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  downloadIDCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { format } = req.query;
      const buffer = await this.idCardService.downloadIDCard(id, req.userId!, format as string);
      
      const fileName = `id-card-${id}.${format === 'pdf' ? 'pdf' : 'png'}`;
      res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };
}