import cloudinary from '../config/cloudinary';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  originalFilename: string;
}

export class UploadService {
  private uploadToCloudinary(
    fileBuffer: Buffer,
    options: {
      folder?: string;
      publicId?: string;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
      transformation?: any;
    } = {}
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'hrms',
          public_id: options.publicId,
          resource_type: options.resourceType || 'auto',
          transformation: options.transformation,
          allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx'],
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            logger.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error('Unknown error during upload'));
          }
        }
      );

      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  async uploadSingle(file: Express.Multer.File, userId: string): Promise<UploadResult> {
    try {
      logger.info(`Starting upload for file: ${file.originalname}, size: ${file.size} bytes`);

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new ApiError(400, 'File size exceeds 10MB limit');
      }

      const result = await this.uploadToCloudinary(file.buffer, {
        folder: 'hrms/uploads',
        resourceType: 'auto',
      });

      logger.info(`Upload successful: ${result.secure_url}`);

      const uploadResult: UploadResult = {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        format: result.format || '',
        width: result.width || 0,
        height: result.height || 0,
        bytes: result.bytes,
        originalFilename: file.originalname,
      };

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entity: 'Upload',
          entityId: result.public_id,
          changes: JSON.stringify({
            filename: file.originalname,
            size: file.size,
            url: result.secure_url,
          }),
        },
      });

      return uploadResult;
    } catch (error) {
      logger.error('Upload error:', error);
      // Re-throw ApiError or convert to ApiError
      if (error instanceof ApiError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown upload error';
      throw new ApiError(500, `Failed to upload file: ${message}`);
    }
  }

  async uploadMultiple(files: Express.Multer.File[], userId: string): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (const file of files) {
      try {
        const result = await this.uploadSingle(file, userId);
        results.push(result);
      } catch (error) {
        logger.error(`Failed to upload file ${file.originalname}:`, error);
        // Continue with other files
      }
    }
    return results;
  }

  async uploadEmployeeAvatar(file: Express.Multer.File, employeeId: string, userId: string): Promise<UploadResult> {
    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: true },
    });
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Delete old avatar if exists
    if (employee.avatar) {
      try {
        const publicId = this.extractPublicId(employee.avatar);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        logger.warn('Could not delete old avatar:', error);
      }
    }

    // Upload new avatar
    const result = await this.uploadToCloudinary(file.buffer, {
      folder: `hrms/employees/${employeeId}`,
      publicId: 'avatar',
      resourceType: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
      ],
    });

    const uploadResult: UploadResult = {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format || '',
      width: result.width || 0,
      height: result.height || 0,
      bytes: result.bytes,
      originalFilename: file.originalname,
    };

    // Update employee avatar
    await prisma.employee.update({
      where: { id: employeeId },
      data: { avatar: result.secure_url },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Employee',
        entityId: employeeId,
        changes: JSON.stringify({ avatar: result.secure_url }),
        companyId: employee.companyId,
        branchId: employee.branchId || null,
      },
    });

    return uploadResult;
  }

  async uploadCompanyLogo(file: Express.Multer.File, companyId: string, userId: string): Promise<UploadResult> {
    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Delete old logo if exists
    if (company.logo) {
      try {
        const publicId = this.extractPublicId(company.logo);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        logger.warn('Could not delete old logo:', error);
      }
    }

    // Upload new logo
    const result = await this.uploadToCloudinary(file.buffer, {
      folder: `hrms/companies/${companyId}`,
      publicId: 'logo',
      resourceType: 'image',
      transformation: [
        { width: 200, height: 200, crop: 'fill' },
        { quality: 'auto' },
      ],
    });

    const uploadResult: UploadResult = {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format || '',
      width: result.width || 0,
      height: result.height || 0,
      bytes: result.bytes,
      originalFilename: file.originalname,
    };

    // Update company logo
    await prisma.company.update({
      where: { id: companyId },
      data: { logo: result.secure_url },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Company',
        entityId: companyId,
        changes: JSON.stringify({ logo: result.secure_url }),
        companyId,
      },
    });

    return uploadResult;
  }

  async deleteFile(publicId: string, userId: string): Promise<{ deleted: boolean }> {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only Super Admin can delete files');
    }

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      logger.error('Failed to delete file from Cloudinary:', error);
      throw new ApiError(500, 'Failed to delete file');
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Upload',
        entityId: publicId,
        changes: JSON.stringify({ publicId }),
        companyId: currentUser.companyId || undefined,
      },
    });

    return { deleted: true };
  }

  private extractPublicId(url: string): string | null {
    try {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      const publicId = filename.split('.')[0];
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex !== -1 && uploadIndex + 1 < parts.length) {
        const folderParts = parts.slice(uploadIndex + 2, parts.length - 1);
        if (folderParts.length > 0) {
          return `${folderParts.join('/')}/${publicId}`;
        }
      }
      return publicId;
    } catch {
      return null;
    }
  }
}