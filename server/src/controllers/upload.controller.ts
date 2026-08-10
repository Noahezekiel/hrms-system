import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service';

export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  uploadSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
      }

      const result = await this.uploadService.uploadSingle(req.file, req.userId!);
      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  uploadMultiple = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new ApiError(400, 'No files uploaded');
      }

      const results = await this.uploadService.uploadMultiple(req.files, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  };

  uploadEmployeeAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
      }

      const result = await this.uploadService.uploadEmployeeAvatar(req.file, employeeId, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Employee avatar uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  uploadCompanyLogo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
      }

      const result = await this.uploadService.uploadCompanyLogo(req.file, companyId, req.userId!);
      res.status(200).json({
        success: true,
        message: 'Company logo uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { publicId } = req.params;
      const result = await this.uploadService.deleteFile(publicId, req.userId!);
      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}