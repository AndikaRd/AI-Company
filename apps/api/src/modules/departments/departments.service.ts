import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId?: string) {
    return this.prisma.department.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        company: true,
        employees: {
          include: {
            agentConfig: true,
          },
        },
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }

    return department;
  }

  async create(createDepartmentDto: CreateDepartmentDto) {
    const slug = createDepartmentDto.slug || createDepartmentDto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const company = await this.prisma.company.findUnique({
      where: { id: createDepartmentDto.companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${createDepartmentDto.companyId}" not found`);
    }

    const existing = await this.prisma.department.findUnique({
      where: {
        companyId_slug: {
          companyId: createDepartmentDto.companyId,
          slug,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Department with slug "${slug}" already exists in this company`);
    }

    return this.prisma.department.create({
      data: {
        ...createDepartmentDto,
        slug,
      },
    });
  }
}

