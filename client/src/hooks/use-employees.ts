'use client';

import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { api } from '@/lib/api';

interface EmployeeFilters {
  search?: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  positionId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export function useEmployees() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchEmployees = useCallback(async (filters: EmployeeFilters = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/employees', {
        params: {
          page: filters.page || 1,
          limit: filters.limit || 10,
          search: filters.search,
          companyId: filters.companyId,
          branchId: filters.branchId,
          departmentId: filters.departmentId,
          positionId: filters.positionId,
          isActive: filters.isActive,
        },
      });
      setEmployees(response.data.data);
      setTotal(response.data.pagination.total);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        totalPages: response.data.pagination.totalPages,
      });
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch employees',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getEmployee = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/employees/${id}`);
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch employee',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createEmployee = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await api.post('/employees', data);
      toast({
        title: 'Success',
        description: 'Employee created successfully',
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create employee',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateEmployee = useCallback(async (id: string, data: any) => {
    setLoading(true);
    try {
      const response = await api.put(`/employees/${id}`, data);
      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update employee',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteEmployee = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/employees/${id}`);
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete employee',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const toggleEmployeeStatus = useCallback(async (id: string, isActive: boolean) => {
    setLoading(true);
    try {
      const response = await api.patch(`/employees/${id}/status`, { isActive });
      toast({
        title: 'Success',
        description: `Employee ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update employee status',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    employees,
    total,
    pagination,
    loading,
    fetchEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
  };
}