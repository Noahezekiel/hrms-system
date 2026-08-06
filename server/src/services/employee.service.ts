import { Prisma, Employee, Gender } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { generateQRCode } from '../utils/qrcode';
import { generateBarcode } from '../utils/barcode';
import logger from '../utils/logger';
import { IDCardService } from './idCard.service';

export interface EmployeeCreateInput {
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  gender: Gender;
  dateOfBirth: string | Date;
  hireDate: string | Date;
  terminationDate?: string | Date;
  isActive?: boolean;
  avatar?: string;
  biometricId?: string;
  facialData?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  companyId: string;
  branchId?: string;
  departmentId?: string;
  positionId?: string;
  managerId?: string;
}

export interface EmployeeUpdateInput {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string | Date;
  hireDate?: string | Date;
  terminationDate?: string | Date;
  isActive?: boolean;
  avatar?: string;
  biometricId?: string;
  facialData?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  positionId?: string;
  managerId?: string;
}

export class EmployeeService {
  private idCardService: IDCardService;

  constructor() {
    this.idCardService = new IDCardService();
  }

  async getAllEmployees(params: {
    page: number;
    limit: number;
    search?: string;
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    positionId?: string;
    isActive?: boolean;
    userId: string;
  }) {
    const { page, limit, search, companyId, branchId, departmentId, positionId, isActive, userId } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, branchId: true, departmentId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    // Build where clause
    const where: Prisma.EmployeeWhereInput = {};

    // Super admin can see all; others see only their company
    if (currentUser.role !== 'SUPER_ADMIN') {
      where.companyId = currentUser.companyId || undefined;
      if (currentUser.role === 'DEPARTMENT_MANAGER') {
        where.departmentId = currentUser.departmentId || undefined;
      }
      if (currentUser.role === 'STAFF') {
        // Staff see only themselves via their employee record
        const employee = await prisma.employee.findFirst({
          where: { user: { id: userId } },
          select: { id: true },
        });
        if (employee) {
          where.id = employee.id;
        } else {
          where.id = 'nonexistent'; // No access
        }
      }
    }

    // Apply filters
    if (companyId) {
      if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
        throw new ApiError(403, 'Access denied');
      }
      where.companyId = companyId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (positionId) {
      where.positionId = positionId;
    }

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get total count
    const total = await prisma.employee.count({ where });

    // Get employees
    const employees = await prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        position: {
          select: { id: true, name: true, code: true },
        },
        manager: {
          select: { id: true, employeeId: true, firstName: true, lastName: true },
        },
        user: {
          select: { id: true, email: true, role: true, isActive: true },
        },
        idCard: {
          select: { id: true, cardNumber: true, issueDate: true, expiryDate: true, isActive: true },
        },
        _count: {
          select: {
            attendance: true,
            leaveRequests: true,
          },
        },
      },
    });

    return {
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEmployeeById(id: string, userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, code: true, logo: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        position: {
          select: { id: true, name: true, code: true },
        },
        manager: {
          select: { id: true, employeeId: true, firstName: true, lastName: true, email: true, phone: true },
        },
        subordinates: {
          select: { id: true, employeeId: true, firstName: true, lastName: true },
        },
        user: {
          select: { id: true, email: true, role: true, isActive: true },
        },
        idCard: true,
        shifts: {
          where: { isActive: true },
          include: {
            shift: true,
          },
        },
        _count: {
          select: {
            attendance: true,
            leaveRequests: true,
          },
        },
      },
    });

    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, departmentId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'DEPARTMENT_MANAGER' && employee.departmentId !== currentUser.departmentId && employee.id !== currentUser.employeeId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'STAFF') {
      // Staff can only see their own record
      const currentEmployee = await prisma.employee.findFirst({
        where: { user: { id: userId } },
        select: { id: true },
      });
      if (!currentEmployee || currentEmployee.id !== id) {
        throw new ApiError(403, 'Access denied');
      }
    }

    return employee;
  }

  async getEmployeeByEmployeeId(employeeId: string, userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Use getEmployeeById to handle permissions
    return this.getEmployeeById(employee.id, userId);
  }

  async createEmployee(data: EmployeeCreateInput, userId: string) {
    const {
      employeeId,
      firstName,
      lastName,
      middleName,
      email,
      phone,
      gender,
      dateOfBirth,
      hireDate,
      terminationDate,
      isActive,
      avatar,
      biometricId,
      facialData,
      address,
      city,
      state,
      country,
      zipCode,
      emergencyContact,
      emergencyPhone,
      notes,
      companyId,
      branchId,
      departmentId,
      positionId,
      managerId,
    } = data;

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
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Check if employeeId is unique
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId },
    });
    if (existingEmployee) {
      throw new ApiError(409, 'Employee ID already exists');
    }

    // Check if email is unique
    const emailExists = await prisma.employee.findUnique({
      where: { email },
    });
    if (emailExists) {
      throw new ApiError(409, 'Email already exists');
    }

    // If biometricId is provided, check uniqueness
    if (biometricId) {
      const biometricExists = await prisma.employee.findUnique({
        where: { biometricId },
      });
      if (biometricExists) {
        throw new ApiError(409, 'Biometric ID already assigned to another employee');
      }
    }

    // Check branch if provided
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          companyId,
        },
      });
      if (!branch) {
        throw new ApiError(404, 'Branch not found in this company');
      }
    }

    // Check department if provided
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          companyId,
        },
      });
      if (!department) {
        throw new ApiError(404, 'Department not found in this company');
      }
    }

    // Check position if provided
    if (positionId) {
      const position = await prisma.position.findFirst({
        where: {
          id: positionId,
          department: {
            companyId,
          },
        },
      });
      if (!position) {
        throw new ApiError(404, 'Position not found in this company');
      }
    }

    // Check manager if provided
    if (managerId) {
      const manager = await prisma.employee.findFirst({
        where: {
          id: managerId,
          companyId,
        },
      });
      if (!manager) {
        throw new ApiError(404, 'Manager not found in this company');
      }
    }

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        employeeId,
        firstName,
        lastName,
        middleName,
        email,
        phone,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        hireDate: new Date(hireDate),
        terminationDate: terminationDate ? new Date(terminationDate) : null,
        isActive: isActive !== undefined ? isActive : true,
        avatar,
        biometricId,
        facialData,
        address,
        city,
        state,
        country,
        zipCode,
        emergencyContact,
        emergencyPhone,
        notes,
        companyId,
        branchId,
        departmentId,
        positionId,
        managerId,
        createdBy: userId,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, name: true },
        },
        manager: {
          select: { id: true, employeeId: true, firstName: true, lastName: true },
        },
      },
    });

    // Generate QR code and barcode for the employee
    await this.generateEmployeeQRAndBarcode(employee.id);

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Employee',
        entityId: employee.id,
        changes: { data },
      },
    });

    return employee;
  }

  async updateEmployee(id: string, data: EmployeeUpdateInput, userId: string) {
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });
    if (!existingEmployee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, departmentId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && existingEmployee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'DEPARTMENT_MANAGER' && existingEmployee.departmentId !== currentUser.departmentId && existingEmployee.id !== currentUser.employeeId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'STAFF' && existingEmployee.id !== currentUser.employeeId) {
      throw new ApiError(403, 'Access denied');
    }

    // If companyId is being updated, check permissions
    if (data.companyId && data.companyId !== existingEmployee.companyId) {
      if (currentUser.role !== 'SUPER_ADMIN') {
        throw new ApiError(403, 'Cannot move employee to another company');
      }
      const newCompany = await prisma.company.findUnique({
        where: { id: data.companyId },
      });
      if (!newCompany) {
        throw new ApiError(404, 'Target company not found');
      }
    }

    // If email is being updated, check uniqueness
    if (data.email && data.email !== existingEmployee.email) {
      const emailExists = await prisma.employee.findFirst({
        where: {
          email: data.email,
          id: { not: id },
        },
      });
      if (emailExists) {
        throw new ApiError(409, 'Email already exists');
      }
    }

    // If employeeId is being updated, check uniqueness
    if (data.employeeId && data.employeeId !== existingEmployee.employeeId) {
      const idExists = await prisma.employee.findFirst({
        where: {
          employeeId: data.employeeId,
          id: { not: id },
        },
      });
      if (idExists) {
        throw new ApiError(409, 'Employee ID already exists');
      }
    }

    // If biometricId is being updated, check uniqueness
    if (data.biometricId && data.biometricId !== existingEmployee.biometricId) {
      const biometricExists = await prisma.employee.findFirst({
        where: {
          biometricId: data.biometricId,
          id: { not: id },
        },
      });
      if (biometricExists) {
        throw new ApiError(409, 'Biometric ID already assigned to another employee');
      }
    }

    // Validate branch, department, position, manager if provided
    const companyId = data.companyId || existingEmployee.companyId;
    if (data.branchId) {
      const branch = await prisma.branch.findFirst({
        where: {
          id: data.branchId,
          companyId,
        },
      });
      if (!branch) {
        throw new ApiError(404, 'Branch not found in this company');
      }
    }
    if (data.departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: data.departmentId,
          companyId,
        },
      });
      if (!department) {
        throw new ApiError(404, 'Department not found in this company');
      }
    }
    if (data.positionId) {
      const position = await prisma.position.findFirst({
        where: {
          id: data.positionId,
          department: {
            companyId,
          },
        },
      });
      if (!position) {
        throw new ApiError(404, 'Position not found in this company');
      }
    }
    if (data.managerId) {
      const manager = await prisma.employee.findFirst({
        where: {
          id: data.managerId,
          companyId,
        },
      });
      if (!manager) {
        throw new ApiError(404, 'Manager not found in this company');
      }
    }

    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        terminationDate: data.terminationDate ? new Date(data.terminationDate) : null,
        isActive: data.isActive,
        avatar: data.avatar,
        biometricId: data.biometricId,
        facialData: data.facialData,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        notes: data.notes,
        companyId: data.companyId,
        branchId: data.branchId,
        departmentId: data.departmentId,
        positionId: data.positionId,
        managerId: data.managerId,
        updatedBy: userId,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, name: true },
        },
        manager: {
          select: { id: true, employeeId: true, firstName: true, lastName: true },
        },
      },
    });

    // Regenerate QR/Barcode if employeeId or company changed? Not needed.

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Employee',
        entityId: id,
        changes: { before: existingEmployee, after: data },
      },
    });

    return updatedEmployee;
  }

  async deleteEmployee(id: string, userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        attendance: true,
        leaveRequests: true,
        idCard: true,
      },
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
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Check if employee has attendance or leave records
    if (employee.attendance.length > 0 || employee.leaveRequests.length > 0) {
      throw new ApiError(400, 'Cannot delete employee with existing attendance or leave records. Please archive them first.');
    }

    // Delete ID card if exists
    if (employee.idCard) {
      await prisma.iDCard.delete({
        where: { id: employee.idCard.id },
      });
    }

    // Delete employee
    await prisma.employee.delete({
      where: { id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Employee',
        entityId: id,
        changes: { deletedEmployee: employee },
      },
    });
  }

  async updateEmployeeStatus(id: string, isActive: boolean, userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
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
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { isActive },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Employee',
        entityId: id,
        changes: { isActive },
      },
    });

    return updatedEmployee;
  }

  async uploadAvatar(id: string, avatar: string, userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
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
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { avatar },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Employee',
        entityId: id,
        changes: { avatar },
      },
    });

    return updatedEmployee;
  }

  async generateEmployeeQRAndBarcode(employeeId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        company: true,
      },
    });

    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      company: employee.company?.name || '',
      email: employee.email,
    });

    const qrCode = await generateQRCode(qrData);
    const barcode = await generateBarcode(employee.employeeId);

    // Store in IDCard table
    const cardNumber = `CARD-${employee.employeeId}`;
    const idCard = await prisma.iDCard.upsert({
      where: { employeeId: employee.id },
      update: {
        qrCode,
        barcode,
        cardNumber,
        isActive: true,
        issueDate: new Date(),
      },
      create: {
        employeeId: employee.id,
        cardNumber,
        qrCode,
        barcode,
        isActive: true,
        issueDate: new Date(),
      },
    });

    // Update employee with QR and barcode references if needed
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        qrCode,
        barcode: barcode,
      },
    });

    return idCard;
  }

  async getEmployeeAttendance(id: string, params: {
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
    userId: string;
  }) {
    const employee = await prisma.employee.findUnique({
      where: { id },
    });
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { role: true, companyId: true, departmentId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'DEPARTMENT_MANAGER' && employee.departmentId !== currentUser.departmentId && employee.id !== currentUser.employeeId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'STAFF') {
      const currentEmployee = await prisma.employee.findFirst({
        where: { user: { id: params.userId } },
        select: { id: true },
      });
      if (!currentEmployee || currentEmployee.id !== id) {
        throw new ApiError(403, 'Access denied');
      }
    }

    const { startDate, endDate, page, limit } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.AttendanceWhereInput = { employeeId: id };

    if (startDate) {
      where.date = { gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date = { ...where.date, lte: end };
    }

    const total = await prisma.attendance.count({ where });

    const attendance = await prisma.attendance.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      include: {
        shift: true,
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Calculate summary
    const summary = await this.calculateAttendanceSummary(id, startDate, endDate);

    return {
      attendance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    };
  }

  private async calculateAttendanceSummary(employeeId: string, startDate?: string, endDate?: string) {
    const where: Prisma.AttendanceWhereInput = { employeeId };

    if (startDate) {
      where.date = { gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date = { ...where.date, lte: end };
    }

    const attendances = await prisma.attendance.findMany({
      where,
    });

    const totalDays = attendances.length;
    const present = attendances.filter(a => a.status === 'PRESENT').length;
    const absent = attendances.filter(a => a.status === 'ABSENT').length;
    const late = attendances.filter(a => a.status === 'LATE').length;
    const halfDay = attendances.filter(a => a.status === 'HALF_DAY').length;
    const holiday = attendances.filter(a => a.status === 'HOLIDAY').length;
    const leave = attendances.filter(a => a.status === 'LEAVE').length;
    const overtime = attendances.filter(a => a.isOvertime).length;

    const totalHours = attendances.reduce((sum, a) => sum + (a.totalHours || 0), 0);
    const totalOvertimeHours = attendances.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

    return {
      totalDays,
      present,
      absent,
      late,
      halfDay,
      holiday,
      leave,
      overtime,
      totalHours: Math.round(totalHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      attendanceRate: totalDays > 0 ? Math.round((present / totalDays) * 100) : 0,
    };
  }

  async getEmployeeLeaveRequests(id: string, params: {
    page: number;
    limit: number;
    status?: string;
    userId: string;
  }) {
    const employee = await prisma.employee.findUnique({
      where: { id },
    });
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { role: true, companyId: true, departmentId: true },
    });

    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'DEPARTMENT_MANAGER' && employee.departmentId !== currentUser.departmentId && employee.id !== currentUser.employeeId) {
      throw new ApiError(403, 'Access denied');
    }

    if (currentUser.role === 'STAFF') {
      const currentEmployee = await prisma.employee.findFirst({
        where: { user: { id: params.userId } },
        select: { id: true },
      });
      if (!currentEmployee || currentEmployee.id !== id) {
        throw new ApiError(403, 'Access denied');
      }
    }

    const { page, limit, status } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.LeaveRequestWhereInput = { employeeId: id };

    if (status) {
      where.status = status as any;
    }

    const total = await prisma.leaveRequest.count({ where });

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: { id: true, employeeId: true, firstName: true, lastName: true },
        },
        company: {
          select: { id: true, name: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      leaveRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async generateIDCard(id: string, userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        company: true,
        department: true,
        position: true,
      },
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
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    // Generate QR and Barcode if not exists
    let idCard = await prisma.iDCard.findUnique({
      where: { employeeId: id },
    });

    if (!idCard) {
      idCard = await this.generateEmployeeQRAndBarcode(id);
    } else {
      // Regenerate if needed
      const qrData = JSON.stringify({
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        company: employee.company?.name || '',
        email: employee.email,
      });
      const qrCode = await generateQRCode(qrData);
      const barcode = await generateBarcode(employee.employeeId);
      idCard = await prisma.iDCard.update({
        where: { employeeId: id },
        data: {
          qrCode,
          barcode,
          issueDate: new Date(),
          isActive: true,
        },
      });
    }

    return idCard;
  }

  async getEmployeeIDCard(id: string, userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
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
      throw new ApiError(404, 'Current user not found');
    }

    if (currentUser.role !== 'SUPER_ADMIN' && employee.companyId !== currentUser.companyId) {
      throw new ApiError(403, 'Access denied');
    }

    const idCard = await prisma.iDCard.findUnique({
      where: { employeeId: id },
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
}