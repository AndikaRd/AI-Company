import { EmployeeActivityState, CharacterAnimationState } from './character';

export enum SocketEvents {
  // Agent Lifecycle
  AGENT_STATUS_CHANGED = 'agent:status_changed',
  AGENT_ACTION_STARTED = 'agent:action_started',
  AGENT_ACTION_COMPLETED = 'agent:action_completed',

  // Sprint 6: Real-time Employee & 3D Office Events
  EMPLOYEE_ACTIVITY_UPDATED = 'employee:activity_updated',
  EMPLOYEE_TASK_STARTED = 'employee:task_started',
  EMPLOYEE_TASK_COMPLETED = 'employee:task_completed',
  EMPLOYEE_TASK_FAILED = 'employee:task_failed',
  EMPLOYEE_APPROVAL_REQUIRED = 'employee:approval_required',
  AGENT_MESSAGE_CREATED = 'agent:message_created',
  EMPLOYEE_LOCATION_UPDATED = 'employee:location_updated',

  // Office Interaction
  OFFICE_ZONE_ENTERED = 'office:zone_entered',
  OFFICE_ZONE_LEFT = 'office:zone_left',
  OFFICE_BROADCAST = 'office:broadcast',

  // Connection
  CONNECTED = 'connect',
  DISCONNECTED = 'disconnect',
}

export interface AgentStatusChangedPayload {
  employeeId: string;
  status: 'ACTIVE' | 'IDLE' | 'BUSY' | 'OFFLINE';
  timestamp: string;
}

export interface EmployeeActivityUpdatedPayload {
  employeeId: string;
  employeeCode?: string;
  name?: string;
  activity: EmployeeActivityState;
  animationState: CharacterAnimationState;
  currentTaskId?: string | null;
  taskTitle?: string | null;
  workstationId?: string | null;
  departmentSlug?: string | null;
  details?: string | null;
  timestamp: string;
}

export interface EmployeeTaskStartedPayload {
  taskId: string;
  taskTitle: string;
  employeeId: string;
  timestamp: string;
}

export interface EmployeeTaskCompletedPayload {
  taskId: string;
  taskTitle: string;
  employeeId: string;
  exitCode: number;
  timestamp: string;
}

export interface EmployeeTaskFailedPayload {
  taskId: string;
  taskTitle: string;
  employeeId: string;
  error: string;
  timestamp: string;
}

export interface EmployeeApprovalRequiredPayload {
  approvalId: string;
  taskId: string;
  toolName: string;
  employeeId: string;
  timestamp: string;
}

export interface AgentMessageCreatedPayload {
  messageId: string;
  senderEmployeeId: string;
  recipientEmployeeId: string;
  messageType: string;
  correlationId: string;
  timestamp: string;
}

export interface EmployeeLocationUpdatedPayload {
  employeeId: string;
  workstationId: string;
  position: [number, number, number];
  rotationY?: number;
  timestamp: string;
}

