import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string) {
    const data = await this.departmentsService.findAll(companyId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.departmentsService.findOne(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const data = await this.departmentsService.create(createDepartmentDto);
    return {
      success: true,
      data,
      message: 'Department created successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
