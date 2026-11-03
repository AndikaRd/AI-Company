import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useOfficeStore } from '../store/useOfficeStore';
import { useCompanyFeedStore } from '../store/useCompanyFeedStore';
import { api } from '../services/api';
import { SocketEvents, EmployeeActivityUpdatedPayload, CompanyFeedItem } from '@vac/shared';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export const useOfficeSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const {
    setSocketConnected,
    setConnectionState,
    setAllActivities,
    updateEmployeeActivity,
    setAllNeeds,
    updateEmployeeNeeds,
    setAllLifeStates,
    updateEmployeeLifeState,
  } = useOfficeStore();

  useEffect(() => {
    // 1. Initial State Sync via REST API for immediate rendering
    setConnectionState('CONNECTING');
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

    // 1b. Sync Life Simulation State (Needs & Life Behavior)
    api
      .getLifeSimulationStatus()
      .then((status) => {
        if (status?.needs) setAllNeeds(status.needs);
        if (status?.lifeStates) setAllLifeStates(status.lifeStates);
      })
      .catch((err) => {
        console.warn('[OfficeSocket] Life simulation sync deferred:', err.message);
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
      setConnectionState('CONNECTED');
      // Request active office state snapshot
      socket.emit('office:get_state');
    });

    socket.on('disconnect', (reason) => {
      console.log('[OfficeSocket] Disconnected:', reason);
      setConnectionState('DISCONNECTED');
    });

    socket.on('connect_error', (error) => {
      console.warn('[OfficeSocket] Connection error:', error.message);
      setConnectionState('ERROR');
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

    // Sprint 6.7: Global Company Feed & CEO Command Real-time Listeners
    socket.on(SocketEvents.COMPANY_FEED_ITEM_ADDED, (payload: CompanyFeedItem) => {
      console.log('[OfficeSocket] Feed item added:', payload);
      if (payload && payload.id) {
        useCompanyFeedStore.getState().addFeedItem(payload);
      }
    });

    socket.on(SocketEvents.CEO_INSTRUCTION_DISPATCHED, (payload: any) => {
      console.log('[OfficeSocket] CEO instruction dispatched:', payload);
      // Ensure command history and feed are refreshed
      useCompanyFeedStore.getState().fetchCommandHistory();
      useCompanyFeedStore.getState().fetchFeed();
    });

    socket.on(SocketEvents.CEO_INSTRUCTION_UPDATED, (payload: any) => {
      console.log('[OfficeSocket] CEO instruction updated:', payload);
      useCompanyFeedStore.getState().fetchCommandHistory();
    });

    // Sprint 7: Employee Life Simulation Real-time Listeners
    socket.on(SocketEvents.EMPLOYEE_NEEDS_UPDATED, (payload: any) => {
      if (payload?.employeeId && payload?.needs) {
        updateEmployeeNeeds(payload);
      }
    });

    socket.on(SocketEvents.EMPLOYEE_LOCATION_UPDATED, (payload: any) => {
      if (payload?.employeeId) {
        updateEmployeeLifeState(payload);
      }
    });

    socket.on(SocketEvents.EMPLOYEE_STARTED_BREAK, (payload: any) => {
      if (payload?.employeeId) {
        updateEmployeeLifeState({
          employeeId: payload.employeeId,
          behavior: payload.behavior || 'WALKING',
          currentLocationId: payload.locationId,
          currentLocationName: payload.locationName,
          currentThought: payload.thought,
        });
      }
    });

    socket.on(SocketEvents.EMPLOYEE_STARTED_DRINKING, (payload: any) => {
      if (payload?.employeeId) {
        updateEmployeeLifeState({
          employeeId: payload.employeeId,
          behavior: 'DRINKING',
          currentLocationId: payload.locationId || 'water_dispenser',
          currentLocationName: payload.locationName || 'Water Dispenser',
          currentThought: payload.thought,
        });
      }
    });

    socket.on(SocketEvents.EMPLOYEE_STARTED_EATING, (payload: any) => {
      if (payload?.employeeId) {
        updateEmployeeLifeState({
          employeeId: payload.employeeId,
          behavior: 'EATING',
          currentLocationId: payload.locationId || 'pantry',
          currentLocationName: payload.locationName || 'Pantry',
          currentThought: payload.thought,
        });
      }
    });

    socket.on(SocketEvents.EMPLOYEE_STARTED_RESTING, (payload: any) => {
      if (payload?.employeeId) {
        updateEmployeeLifeState({
          employeeId: payload.employeeId,
          behavior: 'RESTING',
          currentLocationId: payload.locationId || 'lounge',
          currentLocationName: payload.locationName || 'Lounge',
          currentThought: payload.thought,
        });
      }
    });

    socket.on(SocketEvents.EMPLOYEE_STARTED_SOCIALIZING, (payload: any) => {
      if (payload?.employeeId) {
        updateEmployeeLifeState({
          employeeId: payload.employeeId,
          behavior: 'SOCIALIZING',
          currentLocationId: payload.locationId || 'atrium',
          currentLocationName: payload.locationName || 'Atrium',
          currentThought: payload.thought,
        });
      }
    });

    socket.on(SocketEvents.EMPLOYEE_RESUMED_WORK, (payload: any) => {
      if (payload?.employeeId) {
        updateEmployeeLifeState({
          employeeId: payload.employeeId,
          behavior: 'WORKING',
          currentThought: payload.thought || 'Resumed active work at desk',
        });
      }
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

