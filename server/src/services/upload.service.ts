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
      const result = await this.uploadToCloudinary(file.buffer, {
        folder: 'hrms/uploads',
        resourceType: 'auto',
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

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entity: 'Upload',
          entityId: result.public_id,
          changes: { filename: file.originalname, size: file.size, url: result.secure_url },
        },
      });

      return uploadResult;
    } catch (error) {
      logger.error('Upload error:', error);
      throw new ApiError(500, 'Failed to upload file');
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
        changes: { avatar: result.secure_url },
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
        changes: { logo: result.secure_url },
        companyId,
      },
    });

    return uploadResult;
  }

  async deleteFile(publicId: string, userId: string): Promise<{ deleted: boolean }> {
    // Check permissions - only allow deleting if user is SUPER_ADMIN or owns the file
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    // For simplicity, we allow SUPER_ADMIN to delete any file, others only their company's files
    // We could add more granular checks, but this is a start
    if (currentUser.role !== 'SUPER_ADMIN') {
      // Check if the file belongs to this company (we need to parse publicId to find company)
      // This is complex, we'll skip for now and allow only SUPER_ADMIN to delete
      throw new ApiError(403, 'Only Super Admin can delete files');
    }

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      logger.error('Failed to delete file from Cloudinary:', error);
      throw new ApiError(500, 'Failed to delete file');
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Upload',
        entityId: publicId,
        changes: { publicId },
        companyId: currentUser.companyId || undefined,
      },
    });

    return { deleted: true };
  }

  private extractPublicId(url: string): string | null {
    // Extract public_id from Cloudinary URL
    // Example: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
    try {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      const publicId = filename.split('.')[0];
      // Include folder path if present
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