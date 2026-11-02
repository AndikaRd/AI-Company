import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import {
  EmployeeActivityState,
  CharacterAnimationState,
  EmployeeActivityInfo,
  SocketEvents,
  mapActivityToAnimation,
  EmployeeActivityUpdatedPayload,
} from '@vac/shared';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeeActivityService {
  private readonly logger = new Logger(EmployeeActivityService.name);
  private readonly activities = new Map<string, EmployeeActivityInfo>();

  constructor(
    @Inject(forwardRef(() => EventsGateway))
    private readonly eventsGateway: EventsGateway,
    private readonly prisma: PrismaService,
  ) {
    this.initializeDefaultStates();
  }

  /**
   * Initializes initial default state for employees
   */
  private async initializeDefaultStates() {
    try {
      const employees = await this.prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        include: { department: true },
      });

      for (const emp of employees) {
        this.activities.set(emp.id, {
          employeeId: emp.id,
          activity: 'IDLE',
          animationState: 'idle',
          currentTaskId: null,
          taskTitle: null,
          workstationId: emp.workstationId || null,
          departmentSlug: emp.department?.slug || null,
          details: 'Ready at workstation',
          updatedAt: new Date().toISOString(),
        });
      }
      this.logger.log(`Initialized activity tracker for ${employees.length} active employees`);
    } catch (err: any) {
      this.logger.warn(`Deferred activity initialization: ${err.message}`);
    }
  }

  /**
   * Updates an employee's normalized activity and broadcasts via real-time WebSocket
   */
  async setActivity(
    employeeId: string,
    activity: EmployeeActivityState,
    details?: {
      currentTaskId?: string | null;
      taskTitle?: string | null;
      details?: string | null;
      location?: {
        workstationId?: string;
        departmentSlug?: string;
      };
    },
  ): Promise<EmployeeActivityInfo> {
    const existing = this.activities.get(employeeId);
    const animationState: CharacterAnimationState = mapActivityToAnimation(activity);

    const updated: EmployeeActivityInfo = {
      employeeId,
      activity,
      animationState,
      currentTaskId: details?.currentTaskId !== undefined ? details.currentTaskId : existing?.currentTaskId || null,
      taskTitle: details?.taskTitle !== undefined ? details.taskTitle : existing?.taskTitle || null,
      workstationId: details?.location?.workstationId || existing?.workstationId || null,
      departmentSlug: details?.location?.departmentSlug || existing?.departmentSlug || null,
      details: details?.details || `Status changed to ${activity}`,
      updatedAt: new Date().toISOString(),
    };

    this.activities.set(employeeId, updated);

    // Fetch employee details for broadcast if needed
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { firstName: true, lastName: true, employeeCode: true },
    });

    const payload: EmployeeActivityUpdatedPayload = {
      employeeId,
      employeeCode: emp?.employeeCode || undefined,
      name: emp ? `${emp.firstName} ${emp.lastName}` : undefined,
      activity,
      animationState,
      currentTaskId: updated.currentTaskId,
      taskTitle: updated.taskTitle,
      workstationId: updated.workstationId,
      departmentSlug: updated.departmentSlug,
      details: updated.details,
      timestamp: updated.updatedAt,
    };

    // Broadcast through EventsGateway
    this.eventsGateway.broadcastOfficeEvent(SocketEvents.EMPLOYEE_ACTIVITY_UPDATED, payload);
    this.logger.log(`[Activity] Employee [${payload.name || employeeId}] -> ${activity} (${animationState}) - Task: ${updated.taskTitle || 'none'}`);

    return updated;
  }

  /**
   * Retrieves current activity state for a single employee
   */
  getActivity(employeeId: string): EmployeeActivityInfo | null {
    return this.activities.get(employeeId) || null;
  }

  /**
   * Retrieves current activities across all employees (for initial sync or reconnect)
   */
  getAllActivities(): Record<string, EmployeeActivityInfo> {
    const result: Record<string, EmployeeActivityInfo> = {};
    for (const [id, info] of this.activities.entries()) {
      result[id] = info;
    }
    return result;
  }

  /**
   * Temporarily sets an agent to TALKING state during agent-to-agent message exchange
   */
  triggerTalkingState(senderEmployeeId: string, recipientEmployeeId: string, durationMs = 4000) {
    this.setActivity(senderEmployeeId, 'TALKING', {
      details: 'Conferring with team member',
    });

    setTimeout(() => {
      const current = this.activities.get(senderEmployeeId);
      if (current && current.activity === 'TALKING') {
        // Return to previous logical state (WORKING if they have active task, otherwise IDLE)
        const nextActivity: EmployeeActivityState = current.currentTaskId ? 'WORKING' : 'IDLE';
        this.setActivity(senderEmployeeId, nextActivity, {
          details: current.currentTaskId ? 'Resumed active work' : 'At workstation',
        });
      }
    }, durationMs);
  }
}
