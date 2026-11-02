import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { SendChatMessageDto } from '../ollama/dto/chat-message.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  async findAll(@Query('departmentId') departmentId?: string) {
    const data = await this.employeesService.findAll(departmentId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('stats')
  async getStats() {
    const data = await this.employeesService.getStats();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // --- ORGANIZATIONAL HIERARCHY ENDPOINTS ---

  @Get('hierarchy')
  async getHierarchy() {
    const data = await this.employeesService.getHierarchy();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('eligible')
  async getEligible(
    @Query('skills') skills?: string,
    @Query('role') role?: string,
    @Query('department') department?: string,
  ) {
    const skillsList = skills ? skills.split(',').map((s) => s.trim()) : undefined;
    const data = await this.employeesService.getEligibleEmployees({
      skills: skillsList,
      role,
      departmentSlug: department,
    });
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.employeesService.findOne(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/subordinates')
  async getSubordinates(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.employeesService.getSubordinates(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/supervisor-chain')
  async getSupervisorChain(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.employeesService.getSupervisorChain(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  async create(@Body() createEmployeeDto: CreateEmployeeDto) {
    const data = await this.employeesService.create(createEmployeeDto);
    return {
      success: true,
      data,
      message: 'Employee created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    const data = await this.employeesService.update(id, body);
    return {
      success: true,
      data,
      message: 'Employee updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // --- CONVERSATION & CHAT ENDPOINTS ---

  @Get(':id/conversations')
  async getConversations(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.employeesService.getConversations(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(@Param('conversationId', ParseUUIDPipe) conversationId: string) {
    const data = await this.employeesService.getMessages(conversationId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/chat')
  async chatWithEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() sendChatMessageDto: SendChatMessageDto,
  ) {
    const data = await this.employeesService.chatWithEmployee(id, sendChatMessageDto);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
