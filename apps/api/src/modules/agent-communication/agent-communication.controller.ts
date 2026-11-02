import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AgentCommunicationService } from './agent-communication.service';
import {
  SendAgentMessageDto,
  DelegateTaskDto,
  RespondToDelegationDto,
} from './dto/agent-message.dto';

@Controller('agent-communication')
export class AgentCommunicationController {
  constructor(private readonly commsService: AgentCommunicationService) {}

  @Post('messages')
  async sendMessage(@Body() dto: SendAgentMessageDto) {
    const data = await this.commsService.sendMessage(dto);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('delegate')
  async delegateTask(@Body() dto: DelegateTaskDto) {
    const data = await this.commsService.delegateTask(dto);
    return {
      success: true,
      data,
      message: 'Task delegated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('respond')
  async respondToDelegation(@Body() dto: RespondToDelegationDto) {
    const data = await this.commsService.respondToDelegation(dto);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('recent')
  async getRecentMessages(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const data = await this.commsService.getRecentMessages(limitNum);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('tasks/:taskId')
  async getMessagesForTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    const data = await this.commsService.getMessagesForTask(taskId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('direct/:empA/:empB')
  async getDirectMessages(
    @Param('empA', ParseUUIDPipe) empA: string,
    @Param('empB', ParseUUIDPipe) empB: string,
  ) {
    const data = await this.commsService.getDirectMessages(empA, empB);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}

