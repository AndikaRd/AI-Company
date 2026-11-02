import { Module, forwardRef } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskRunnerService } from './task-runner.service';
import { TaskOrchestratorService } from './task-orchestrator.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ToolsModule } from '../tools/tools.module';
import { OllamaModule } from '../ollama/ollama.module';
import { AgentCommunicationModule } from '../agent-communication/agent-communication.module';
import { MemoryModule } from '../memory/memory.module';

@Module({
  imports: [
    PrismaModule,
    ToolsModule,
    OllamaModule,
    forwardRef(() => AgentCommunicationModule),
    MemoryModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskRunnerService, TaskOrchestratorService],
  exports: [TasksService, TaskRunnerService, TaskOrchestratorService],
})
export class TasksModule {}
