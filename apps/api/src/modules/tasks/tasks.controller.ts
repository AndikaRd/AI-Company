import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskOrchestratorService } from './task-orchestrator.service';
import { CreateTaskDto, ReviewApprovalDto } from './dto/task.dto';
import { TaskStatus } from '@prisma/client';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskOrchestrator: TaskOrchestratorService,
  ) {}

  @Get()
  async listTasks(
    @Query('status') status?: TaskStatus,
    @Query('employeeId') employeeId?: string,
  ) {
    const data = await this.tasksService.findAll({ status, employeeId });
    return {
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  async createTask(@Body() dto: CreateTaskDto) {
    const data = await this.tasksService.createTask(dto);
    return {
      success: true,
      data,
      message: `Task successfully created and dispatched to ${data.assignedEmployee?.firstName || 'employee'}.`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('approvals/pending')
  async getPendingApprovals() {
    const data = await this.tasksService.getPendingApprovals();
    return {
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('approvals/:id/review')
  async reviewApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewApprovalDto,
  ) {
    const data = await this.tasksService.reviewApproval(id, dto);
    return {
      success: true,
      data,
      message: `Approval request ${dto.approved ? 'APPROVED' : 'REJECTED'}.`,
      timestamp: new Date().toISOString(),
    };
  }

  // --- MULTI-AGENT TASK DECOMPOSITION & TREE ENDPOINTS ---

  @Post(':id/decompose')
  async decomposeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { coordinatorEmployeeId: string; guidelines?: string },
  ) {
    const data = await this.taskOrchestrator.decomposeTask({
      taskId: id,
      coordinatorEmployeeId: body.coordinatorEmployeeId,
      guidelines: body.guidelines,
    });
    return {
      success: true,
      data,
      message: `Task successfully decomposed into ${data.subtasks.length} subtasks.`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/tree')
  async getTaskTree(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.taskOrchestrator.getTaskTree(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/consolidate')
  async consolidateTask(@Param('id', ParseUUIDPipe) id: string) {
    const completed = await this.taskOrchestrator.checkParentTaskCompletion(id);
    return {
      success: true,
      data: { completed },
      message: completed
        ? 'Parent task successfully consolidated and completed.'
        : 'Subtasks are still in progress or require supervisor review.',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async getTask(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.tasksService.findById(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/retry')
  async retryTask(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.tasksService.retryTask(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
