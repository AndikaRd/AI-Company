import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentCommunicationService } from './agent-communication.service';
import { AgentCommunicationController } from './agent-communication.controller';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [PrismaModule, forwardRef(() => TasksModule)],
  controllers: [AgentCommunicationController],
  providers: [AgentCommunicationService],
  exports: [AgentCommunicationService],
})
export class AgentCommunicationModule {}
