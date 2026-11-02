import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useOfficeStore } from '../store/useOfficeStore';
import { api } from '../services/api';
import { SocketEvents, EmployeeActivityUpdatedPayload } from '@vac/shared';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export const useOfficeSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { setSocketConnected, setAllActivities, updateEmployeeActivity } = useOfficeStore();

  useEffect(() => {
    // 1. Initial State Sync via REST API for immediate rendering
    api
      .getEmployeesActivity()
      .then((activities) => {
        if (activities) {
          setAllActivities(activities);
        }
      })
      .catch((err) => {
        console.warn('[OfficeSocket] REST initial sync deferred:', err.message);
      });

    // 2. Establish Real-Time WebSocket Connection
    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[OfficeSocket] Connected to backend events gateway:', socket.id);
      setSocketConnected(true);
      // Request active office state snapshot
      socket.emit('office:get_state');
    });

    socket.on('disconnect', (reason) => {
      console.log('[OfficeSocket] Disconnected:', reason);
      setSocketConnected(false);
    });

    socket.on('connection_established', (data: any) => {
      if (data?.initialActivities) {
        setAllActivities(data.initialActivities);
      }
    });

    socket.on('office:state', (data: any) => {
      if (data?.activities) {
        setAllActivities(data.activities);
      }
    });

    // Real-time Employee Activity Event
    socket.on(
      SocketEvents.EMPLOYEE_ACTIVITY_UPDATED,
      (payload: EmployeeActivityUpdatedPayload) => {
        console.log('[OfficeSocket] Activity Update:', payload);
        updateEmployeeActivity(payload);
      },
    );

    // Task Execution Events
    socket.on(SocketEvents.EMPLOYEE_TASK_STARTED, (payload: any) => {
      console.log('[OfficeSocket] Task Started:', payload);
    });

    socket.on(SocketEvents.EMPLOYEE_TASK_COMPLETED, (payload: any) => {
      console.log('[OfficeSocket] Task Completed:', payload);
    });

    socket.on(SocketEvents.EMPLOYEE_APPROVAL_REQUIRED, (payload: any) => {
      console.log('[OfficeSocket] Approval Required:', payload);
    });

    socket.on(SocketEvents.AGENT_MESSAGE_CREATED, (payload: any) => {
      console.log('[OfficeSocket] Agent Message Created:', payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [setSocketConnected, setAllActivities, updateEmployeeActivity]);

  return {
    socket: socketRef.current,
  };
};
