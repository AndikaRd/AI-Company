import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketEvents, AgentStatusChangedPayload } from '@vac/shared';
import { EmployeeActivityService } from '../employees/employee-activity.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    @Inject(forwardRef(() => EmployeeActivityService))
    private readonly activityService: EmployeeActivityService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('EventsGateway initialized for real-time AI agent communications');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    const initialActivities = this.activityService ? this.activityService.getAllActivities() : {};

    client.emit('connection_established', {
      status: 'connected',
      socketId: client.id,
      initialActivities,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('agent:ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    client.emit('agent:pong', {
      received: data,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('office:get_state')
  handleGetOfficeState(@ConnectedSocket() client: Socket) {
    const activities = this.activityService ? this.activityService.getAllActivities() : {};
    client.emit('office:state', {
      activities,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper method for broadcasting agent state updates to connected clients / 3D virtual office
  broadcastAgentStatus(payload: AgentStatusChangedPayload) {
    if (this.server) {
      this.server.emit(SocketEvents.AGENT_STATUS_CHANGED, payload);
    }
  }

  broadcastOfficeEvent(event: string, payload: any) {
    if (this.server) {
      this.server.emit(event, payload);
    }
  }
}

