'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

interface DashboardOverview {
  employees: {
    total: number;
    active: number;
    inactive: number;
  };
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    rate: number;
    previousRate: number;
    trend: number;
  };
  leave: {
    pending: number;
    approved: number;
    rejected: number;
  };
  overtime: {
    totalRecords: number;
    totalHours: number;
  };
  departmentDistribution: Array<{
    name: string;
    count: number;
  }>;
}

interface AttendanceChartData {
  date: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  total: number;
}

interface DepartmentStats {
  id: string;
  name: string;
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
}

interface RecentActivity {
  type: 'audit' | 'attendance';
  id: string;
  action: string;
  entity?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  checkIn?: string;
  checkOut?: string;
}

interface LeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  totalDays: number;
  byType: Record<string, { count: number; days: number }>;
}

interface DashboardState {
  overview: DashboardOverview | null;
  attendanceChart: AttendanceChartData[];
  departmentStats: DepartmentStats[];
  recentActivity: RecentActivity[];
  leaveStats: LeaveStats | null;
  isLoading: boolean;
  error: string | null;
  fetchDashboardData: (params?: { period?: string; companyId?: string; branchId?: string }) => Promise<void>;
  fetchAttendanceChart: (params?: { startDate?: string; endDate?: string; companyId?: string; branchId?: string }) => Promise<void>;
  fetchDepartmentStats: (params?: { companyId?: string; branchId?: string }) => Promise<void>;
  fetchRecentActivity: (params?: { companyId?: string; branchId?: string; limit?: number }) => Promise<void>;
  fetchLeaveStats: (params?: { companyId?: string; branchId?: string }) => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  overview: null,
  attendanceChart: [],
  departmentStats: [],
  recentActivity: [],
  leaveStats: null,
  isLoading: false,
  error: null,

  fetchDashboardData: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/dashboard/overview', { params });
      set({ overview: response.data.data, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch dashboard data',
      });
    }
  },

  fetchAttendanceChart: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/dashboard/attendance-chart', { params });
      set({ attendanceChart: response.data.data, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch attendance chart data',
      });
    }
  },

  fetchDepartmentStats: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/dashboard/department-stats', { params });
      set({ departmentStats: response.data.data, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch department stats',
      });
    }
  },

  fetchRecentActivity: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/dashboard/recent-activity', { params });
      set({ recentActivity: response.data.data, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch recent activity',
      });
    }
  },

  fetchLeaveStats: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/dashboard/leave-stats', { params });
      set({ leaveStats: response.data.data, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch leave stats',
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));