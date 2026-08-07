export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'HR_MANAGER' | 'ATTENDANCE_OFFICER' | 'DEPARTMENT_MANAGER' | 'STAFF';
  isActive: boolean;
  lastLogin?: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  employeeId?: string;
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
  department?: {
    id: string;
    name: string;
    code: string;
  };
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: User['role'];
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  employeeId?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}