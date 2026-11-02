import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  async findAll() {
    const data = await this.companyService.findAll();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('active')
  async findActive() {
    const data = await this.companyService.findActive();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.companyService.findOne(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    const data = await this.companyService.create(createCompanyDto);
    return {
      success: true,
      data,
      message: 'Company created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    const data = await this.companyService.update(id, updateCompanyDto);
    return {
      success: true,
      data,
      message: 'Company updated successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
