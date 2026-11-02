import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(departmentId?: string) {
    return this.prisma.employee.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: true,
        agentConfig: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const [total, active, idle, busy, offline, aiAgents] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { status: 'IDLE' } }),
      this.prisma.employee.count({ where: { status: 'BUSY' } }),
      this.prisma.employee.count({ where: { status: 'OFFLINE' } }),
      this.prisma.employee.count({ where: { isAiAgent: true } }),
    ]);

    return {
      totalEmployees: total,
      totalAiAgents: aiAgents,
      activeEmployees: active,
      idleEmployees: idle,
      busyEmployees: busy,
      offlineEmployees: offline,
    };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        agentConfig: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    return employee;
  }

  async create(createEmployeeDto: CreateEmployeeDto) {
    const { agentConfig, departmentId, ...employeeData } = createEmployeeDto;

    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID "${departmentId}" not found`);
    }

    const existing = await this.prisma.employee.findUnique({
      where: { email: employeeData.email },
    });

    if (existing) {
      throw new ConflictException(`Employee with email "${employeeData.email}" already exists`);
    }

    return this.prisma.employee.create({
      data: {
        ...employeeData,
        departmentId,
        ...(agentConfig
          ? {
              agentConfig: {
                create: agentConfig,
              },
            }
          : {}),
      },
      include: {
        department: true,
        agentConfig: true,
      },
    });
  }
}

