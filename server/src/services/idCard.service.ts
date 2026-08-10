import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { generateQRCode, generateQRCodeAsBuffer } from '../utils/qrcode';
import { generateBarcode } from '../utils/barcode';
import { PDFGenerator } from '../utils/pdf';
import logger from '../utils/logger';

export class IDCardService {
  async getAllIDCards(params: {
    page: number;
    limit: number;
    search?: string;
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    isActive?: boolean;
    userId: string;
  }) {
    const { page, limit, search, companyId, branchId, departmentId, isActive, userId } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    const where: Prisma.IDCardWhereInput = {};

    if (currentUser.role !== 'SUPER_ADMIN') {
      where.employee = {
        companyId: currentUser.companyId || undefined,
      };
    }

    if (search) {
      where.OR = [
        { cardNumber: { contains: search, mode: 'insensitive' } },
        { employee: { employeeId: { contains: search, mode: 'insensitive' } } },
        { employee: { firstName: { contains: search, mode: 'insensitive' } } },
        { employee: { lastName: { contains: search, mode: 'insensitive' } } },
        { employee: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (companyId) {
      where.employee = { ...(where.employee as any), companyId };
    }

    if (branchId) {
      where.employee = { ...(where.employee as any), branchId };
    }

    if (departmentId) {
      where.employee = { ...(where.employee as any), departmentId };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const total = await prisma.iDCard.count({ where });

    const idCards = await prisma.iDCard.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            companyId: true, // Added
            company: {
              select: { id: true, name: true, logo: true },
            },
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return {
      idCards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getIDCardById(id: string, userId: string) {
    const idCard = await prisma.iDCard.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            companyId: true, // Added
            company: {
              select: { id: true, name: true, logo: true },
            },
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!idCard) {
      throw new ApiError(404, 'ID Card not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && idCard.employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    return idCard;
  }

  async getIDCardByEmployeeId(employeeId: string, userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: true },
    });
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const idCard = await prisma.iDCard.findUnique({
      where: { employeeId },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            companyId: true,
            company: {
              select: { id: true, name: true, logo: true },
            },
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!idCard) {
      throw new ApiError(404, 'ID Card not found for this employee');
    }

    return idCard;
  }

  async generateIDCard(employeeId: string, userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        company: true,
        department: true,
        position: true,
      },
    });

    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const existing = await prisma.iDCard.findUnique({
      where: { employeeId },
    });

    if (existing) {
      throw new ApiError(409, 'ID Card already exists for this employee. Use regenerate instead.');
    }

    const qrData = JSON.stringify({
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      company: employee.company?.name || '',
      email: employee.email,
      department: employee.department?.name || '',
      position: employee.position?.name || '',
    });

    const qrCode = await generateQRCode(qrData);
    const barcode = await generateBarcode(employee.employeeId);

    const cardNumber = `CARD-${employee.employeeId}`;

    const idCard = await prisma.iDCard.create({
      data: {
        employeeId: employee.id,
        cardNumber,
        qrCode,
        barcode,
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
        template: 'default',
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            companyId: true,
            company: {
              select: { id: true, name: true, logo: true },
            },
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        qrCode,
        barcode: barcode,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'IDCard',
        entityId: idCard.id,
        changes: JSON.stringify({ employeeId }),
        companyId: employee.companyId,
        branchId: employee.branchId || null,
      },
    });

    return idCard;
  }

  async regenerateIDCard(id: string, userId: string) {
    const existing = await prisma.iDCard.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            company: true,
            department: true,
            position: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, 'ID Card not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && existing.employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const employee = existing.employee;

    const qrData = JSON.stringify({
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      company: employee.company?.name || '',
      email: employee.email,
      department: employee.department?.name || '',
      position: employee.position?.name || '',
    });

    const qrCode = await generateQRCode(qrData);
    const barcode = await generateBarcode(employee.employeeId);

    const updated = await prisma.iDCard.update({
      where: { id },
      data: {
        qrCode,
        barcode,
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            companyId: true,
            company: {
              select: { id: true, name: true, logo: true },
            },
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        qrCode,
        barcode: barcode,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'IDCard',
        entityId: id,
        changes: JSON.stringify({ action: 'regenerated' }),
        companyId: employee.companyId,
        branchId: employee.branchId || null,
      },
    });

    return updated;
  }

  async updateIDCardStatus(id: string, isActive: boolean, userId: string) {
    const idCard = await prisma.iDCard.findUnique({
      where: { id },
      include: {
        employee: {
          select: { companyId: true },
        },
      },
    });

    if (!idCard) {
      throw new ApiError(404, 'ID Card not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && idCard.employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const updated = await prisma.iDCard.update({
      where: { id },
      data: { isActive },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'IDCard',
        entityId: id,
        changes: JSON.stringify({ isActive }),
        companyId: idCard.employee.companyId,
      },
    });

    return updated;
  }

  async deleteIDCard(id: string, userId: string) {
    const idCard = await prisma.iDCard.findUnique({
      where: { id },
      include: {
        employee: {
          select: { companyId: true },
        },
      },
    });

    if (!idCard) {
      throw new ApiError(404, 'ID Card not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && idCard.employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    await prisma.iDCard.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'IDCard',
        entityId: id,
        changes: JSON.stringify({ deleted: idCard }),
        companyId: idCard.employee.companyId,
      },
    });
  }

  async downloadIDCard(id: string, userId: string, format: string = 'png') {
    const idCard = await prisma.iDCard.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            company: true,
            department: true,
            position: true,
          },
        },
      },
    });

    if (!idCard) {
      throw new ApiError(404, 'ID Card not found');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true },
    });
    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }
    if (currentUser.role !== 'SUPER_ADMIN' && idCard.employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const employee = idCard.employee;

    if (format === 'pdf') {
      const pdf = new PDFGenerator({
        title: 'Employee ID Card',
        author: employee.company?.name || 'HRMS',
        subject: 'Employee ID Card',
        pageSize: 'A4',
        orientation: 'portrait',
        margin: 20,
      });

      if (employee.company?.logo) {
        try {
          pdf.addImage(employee.company.logo, 80, 80);
        } catch (error) {
          logger.warn('Could not add company logo to PDF:', error);
        }
      }

      pdf.addHeader(
        `${employee.company?.name || 'Company'} ID Card`,
        `Employee ID: ${employee.employeeId}`
      );

      pdf.addText(`Name: ${employee.firstName} ${employee.lastName}`, { fontSize: 14, bold: true });
      pdf.addText(`Email: ${employee.email}`);
      pdf.addText(`Phone: ${employee.phone || 'N/A'}`);
      pdf.addText(`Department: ${employee.department?.name || 'N/A'}`);
      pdf.addText(`Position: ${employee.position?.name || 'N/A'}`);

      pdf.addText(`Card Number: ${idCard.cardNumber}`, { fontSize: 12, bold: true });
      pdf.addText(`Issue Date: ${new Date(idCard.issueDate).toLocaleDateString()}`);
      if (idCard.expiryDate) {
        pdf.addText(`Expiry Date: ${new Date(idCard.expiryDate).toLocaleDateString()}`);
      }

      pdf.addQRCode(idCard.qrCode, 150, 150);
      pdf.addText('Scan QR Code for details', { fontSize: 10, align: 'center' });

      try {
        if (idCard.barcode) {
          // Convert barcode data URL to buffer and add as image
          const barcodeBase64 = idCard.barcode.split(',')[1];
          if (barcodeBase64) {
            const barcodeBuffer = Buffer.from(barcodeBase64, 'base64');
            // Add image from buffer by writing to a temp file or using data URL
            // For simplicity, we can pass the buffer as a data URL
            const barcodeDataUrl = `data:image/png;base64,${barcodeBuffer.toString('base64')}`;
            pdf.addImage(barcodeDataUrl, 200, 40);
          }
        }
      } catch (error) {
        logger.warn('Could not add barcode to PDF:', error);
      }

      pdf.addFooter(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`);

      return await pdf.generateBuffer();
    } else {
      // PNG format – generate QR code as PNG
      const qrBuffer = await generateQRCodeAsBuffer(
        JSON.stringify({
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          company: employee.company?.name || '',
          email: employee.email,
        })
      );
      return qrBuffer;
    }
  }
}