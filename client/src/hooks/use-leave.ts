'use client';

import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { api } from '@/lib/api';
import { useSocketEvents } from './use-socket';

interface LeaveRequestData {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  companyId: string;
  branchId?: string;
  departmentId?: string;
}

export function useLeave() {
  const { toast } = useToast();
  const { emit, isConnected } = useSocketEvents();
  const [loading, setLoading] = useState(false);

  const createRequest = useCallback(async (data: LeaveRequestData) => {
    setLoading(true);
    try {
      const response = await api.post('/leave', data);
      if (isConnected) {
        emit('leave:request', {
          employeeId: data.employeeId,
          leaveId: response.data.data.id,
          status: 'PENDING',
        });
      }
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit leave request',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [emit, isConnected, toast]);

  const approveRequest = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await api.post(`/leave/${id}/approve`);
      toast({
        title: 'Success',
        description: 'Leave request approved',
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve leave',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const rejectRequest = useCallback(async (id: string, reason?: string) => {
    setLoading(true);
    try {
      const response = await api.post(`/leave/${id}/reject`, { rejectedReason: reason });
      toast({
        title: 'Success',
        description: 'Leave request rejected',
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject leave',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const cancelRequest = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await api.post(`/leave/${id}/cancel`);
      toast({
        title: 'Success',
        description: 'Leave request cancelled',
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel leave',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getLeaveBalance = useCallback(async (employeeId: string) => {
    try {
      const response = await api.get(`/leave/balance/${employeeId}`);
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch leave balance',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    createRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
    getLeaveBalance,
    loading,
  };
}