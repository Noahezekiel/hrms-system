'use client';

import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { api } from '@/lib/api';

export function useDepartments() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  const fetchDepartments = useCallback(async (params?: { companyId?: string; branchId?: string }) => {
    setLoading(true);
    try {
      const response = await api.get('/departments', { params });
      setDepartments(response.data.data);
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch departments',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getDepartment = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/departments/${id}`);
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch department',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createDepartment = useCallback(async (data: any) => {
    setLoading(true);
    try {
      const response = await api.post('/departments', data);
      toast({
        title: 'Success',
        description: 'Department created successfully',
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create department',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateDepartment = useCallback(async (id: string, data: any) => {
    setLoading(true);
    try {
      const response = await api.put(`/departments/${id}`, data);
      toast({
        title: 'Success',
        description: 'Department updated successfully',
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update department',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteDepartment = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/departments/${id}`);
      toast({
        title: 'Success',
        description: 'Department deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete department',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    departments,
    loading,
    fetchDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}