'use client';

import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { api } from '@/lib/api';
import { useSocketEvents } from './use-socket';

interface AttendanceAction {
  employeeId: string;
  photo?: string;
  note?: string;
  latitude?: string;
  longitude?: string;
}

export function useAttendance() {
  const { toast } = useToast();
  const { emit, isConnected } = useSocketEvents();
  const [loading, setLoading] = useState(false);

  const checkIn = useCallback(async (data: AttendanceAction) => {
    setLoading(true);
    try {
      const response = await api.post('/attendance/check-in', data);
      if (isConnected) {
        emit('attendance:checkin', {
          employeeId: data.employeeId,
          timestamp: new Date().toISOString(),
        });
      }
      toast({
        title: 'Success',
        description: 'Check-in successful',
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Check-in failed',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [emit, isConnected, toast]);

  const checkOut = useCallback(async (data: AttendanceAction) => {
    setLoading(true);
    try {
      const response = await api.post('/attendance/check-out', data);
      if (isConnected) {
        emit('attendance:checkout', {
          employeeId: data.employeeId,
          timestamp: new Date().toISOString(),
        });
      }
      toast({
        title: 'Success',
        description: 'Check-out successful',
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Check-out failed',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [emit, isConnected, toast]);

  const breakIn = useCallback(async (data: AttendanceAction) => {
    setLoading(true);
    try {
      const response = await api.post('/attendance/break-in', data);
      if (isConnected) {
        emit('attendance:break', {
          employeeId: data.employeeId,
          type: 'IN',
          timestamp: new Date().toISOString(),
        });
      }
      toast({
        title: 'Success',
        description: 'Break started',
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Break start failed',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [emit, isConnected, toast]);

  const breakOut = useCallback(async (data: AttendanceAction) => {
    setLoading(true);
    try {
      const response = await api.post('/attendance/break-out', data);
      if (isConnected) {
        emit('attendance:break', {
          employeeId: data.employeeId,
          type: 'OUT',
          timestamp: new Date().toISOString(),
        });
      }
      toast({
        title: 'Success',
        description: 'Break ended',
      });
      return response.data.data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Break end failed',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [emit, isConnected, toast]);

  return {
    checkIn,
    checkOut,
    breakIn,
    breakOut,
    loading,
  };
}