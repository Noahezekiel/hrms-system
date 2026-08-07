export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'HRMS Enterprise';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  ATTENDANCE_OFFICER: 'ATTENDANCE_OFFICER',
  DEPARTMENT_MANAGER: 'DEPARTMENT_MANAGER',
  STAFF: 'STAFF',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  HR_MANAGER: 'HR Manager',
  ATTENDANCE_OFFICER: 'Attendance Officer',
  DEPARTMENT_MANAGER: 'Department Manager',
  STAFF: 'Staff',
};

export const LEAVE_TYPES = {
  ANNUAL: 'ANNUAL',
  SICK: 'SICK',
  CASUAL: 'CASUAL',
  MATERNITY: 'MATERNITY',
  PATERNITY: 'PATERNITY',
  UNPAID: 'UNPAID',
  OTHER: 'OTHER',
} as const;

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  CASUAL: 'Casual Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  UNPAID: 'Unpaid Leave',
  OTHER: 'Other',
};

export const LEAVE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  HALF_DAY: 'HALF_DAY',
  HOLIDAY: 'HOLIDAY',
  LEAVE: 'LEAVE',
  OVERTIME: 'OVERTIME',
} as const;

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  HALF_DAY: 'Half Day',
  HOLIDAY: 'Holiday',
  LEAVE: 'Leave',
  OVERTIME: 'Overtime',
};

export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;

export const GENDER_LABELS: Record<string, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

export const SHIFT_TYPES = {
  MORNING: 'MORNING',
  EVENING: 'EVENING',
  NIGHT: 'NIGHT',
  FLEXIBLE: 'FLEXIBLE',
  CUSTOM: 'CUSTOM',
} as const;

export const SHIFT_TYPE_LABELS: Record<string, string> = {
  MORNING: 'Morning',
  EVENING: 'Evening',
  NIGHT: 'Night',
  FLEXIBLE: 'Flexible',
  CUSTOM: 'Custom',
};

export const PAGINATION_DEFAULT = {
  PAGE: 1,
  LIMIT: 10,
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  TIME: 'HH:mm',
} as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];