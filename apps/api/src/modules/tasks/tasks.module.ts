import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskRunnerService } from './task-runner.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ToolsModule } from '../tools/tools.module';
import { OllamaModule } from '../ollama/ollama.module';

@Module({
  imports: [PrismaModule, ToolsModule, OllamaModule],
  controllers: [TasksController],
  providers: [TasksService, TaskRunnerService],
  exports: [TasksService, TaskRunnerService],
})
export class TasksModule {}
