import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

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

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.employeesService.findOne(id);
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
}

