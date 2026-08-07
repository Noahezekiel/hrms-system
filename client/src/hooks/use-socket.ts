'use client';

import { useSocket } from '@/contexts/SocketContext';

export function useSocketEvents() {
  const { socket, isConnected, emit, on, off } = useSocket();

  return {
    socket,
    isConnected,
    emit,
    on,
    off,
  };
}