import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentCommunicationService } from './agent-communication.service';
import { AgentCommunicationController } from './agent-communication.controller';
import { TasksModule } from '../tasks/tasks.module';
import { EmployeesModule } from '../employees/employees.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => TasksModule),
    forwardRef(() => EmployeesModule),
    EventsModule,
  ],
  controllers: [AgentCommunicationController],
  providers: [AgentCommunicationService],
  exports: [AgentCommunicationService],
})
export class AgentCommunicationModule {}

