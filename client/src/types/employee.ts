export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  hireDate: string;
  terminationDate?: string;
  isActive: boolean;
  avatar?: string;
  biometricId?: string;
  facialData?: string;
  qrCode?: string;
  barcode?: string;
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
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  company?: {
    id: string;
    name: string;
    code: string;
    logo?: string;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
  position?: {
    id: string;
    name: string;
    code: string;
  };
  manager?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  subordinates?: Employee[];
  user?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  idCard?: {
    id: string;
    cardNumber: string;
    issueDate: string;
    expiryDate?: string;
    isActive: boolean;
  };
  shifts?: EmployeeShift[];
  attendance?: Attendance[];
  leaveRequests?: LeaveRequest[];
  _count?: {
    attendance: number;
    leaveRequests: number;
  };
}

export interface EmployeeShift {
  id: string;
  employeeId: string;
  shiftId: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shift: Shift;
}

export interface Shift {
  id: string;
  name: string;
  code: string;
  description?: string;
  shiftType: 'MORNING' | 'EVENING' | 'NIGHT' | 'FLEXIBLE' | 'CUSTOM';
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isActive: boolean;
  companyId: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    code: string;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  checkInPhoto?: string;
  checkOutPhoto?: string;
  breakIn?: string;
  breakOut?: string;
  breakInPhoto?: string;
  breakOutPhoto?: string;
  overtimeHours?: number;
  totalHours?: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY' | 'LEAVE' | 'OVERTIME';
  shiftId?: string;
  companyId: string;
  branchId?: string;
  isOvertime: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  employee?: Employee;
  shift?: Shift;
  branch?: {
    id: string;
    name: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'ANNUAL' | 'SICK' | 'CASUAL' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'OTHER';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  companyId: string;
  branchId?: string;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  employee?: Employee;
  company?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
}

export interface IDCard {
  id: string;
  employeeId: string;
  cardNumber: string;
  qrCode: string;
  barcode: string;
  issueDate: string;
  expiryDate?: string;
  isActive: boolean;
  template?: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branches?: Branch[];
  departments?: Department[];
  employees?: Employee[];
  _count?: {
    branches: number;
    departments: number;
    employees: number;
    shifts: number;
  };
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  departments?: Department[];
  employees?: Employee[];
  _count?: {
    departments: number;
    employees: number;
    shifts: number;
  };
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  companyId: string;
  branchId?: string;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  branch?: Branch;
  manager?: Employee;
  employees?: Employee[];
  positions?: Position[];
  _count?: {
    employees: number;
    positions: number;
  };
}

export interface Position {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
  department?: Department;
  employees?: Employee[];
  _count?: {
    employees: number;
  };
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
  isRecurring: boolean;
  companyId: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  branch?: Branch;
}