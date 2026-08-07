import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', options);
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(d)} ${formatTime(d)}`;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

export function truncate(str: string, length: number = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'present': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'absent': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'late': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'half_day': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'pending': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'holiday': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'leave': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

export function getStatusVariant(status: string): string {
  const variants: Record<string, string> = {
    'present': 'success',
    'active': 'success',
    'approved': 'success',
    'absent': 'destructive',
    'rejected': 'destructive',
    'inactive': 'destructive',
    'late': 'warning',
    'half_day': 'warning',
    'pending': 'warning',
    'cancelled': 'secondary',
    'holiday': 'default',
    'leave': 'default',
  };
  return variants[status.toLowerCase()] || 'default';
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'COMPANY_ADMIN': 'Company Admin',
    'HR_MANAGER': 'HR Manager',
    'ATTENDANCE_OFFICER': 'Attendance Officer',
    'DEPARTMENT_MANAGER': 'Department Manager',
    'STAFF': 'Staff',
  };
  return labels[role] || role;
}

export function getLeaveTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'ANNUAL': 'Annual Leave',
    'SICK': 'Sick Leave',
    'CASUAL': 'Casual Leave',
    'MATERNITY': 'Maternity Leave',
    'PATERNITY': 'Paternity Leave',
    'UNPAID': 'Unpaid Leave',
    'OTHER': 'Other',
  };
  return labels[type] || type;
}

export function getGenderLabel(gender: string): string {
  const labels: Record<string, string> = {
    'MALE': 'Male',
    'FEMALE': 'Female',
    'OTHER': 'Other',
  };
  return labels[gender] || gender;
}

export function getShiftTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'MORNING': 'Morning',
    'EVENING': 'Evening',
    'NIGHT': 'Night',
    'FLEXIBLE': 'Flexible',
    'CUSTOM': 'Custom',
  };
  return labels[type] || type;
}