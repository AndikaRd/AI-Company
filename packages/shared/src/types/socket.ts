export enum SocketEvents {
  // Agent Lifecycle
  AGENT_STATUS_CHANGED = 'agent:status_changed',
  AGENT_ACTION_STARTED = 'agent:action_started',
  AGENT_ACTION_COMPLETED = 'agent:action_completed',

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

