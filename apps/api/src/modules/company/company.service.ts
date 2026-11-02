import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      include: {
        _count: {
          select: {
            departments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive() {
    const company = await this.prisma.company.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        departments: {
          include: {
            _count: {
              select: {
                employees: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            departments: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('No active company found');
    }

    return company;
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        departments: {
          include: {
            _count: {
              select: { employees: true },
            },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    return company;
  }

  async create(createCompanyDto: CreateCompanyDto) {
    const slug = createCompanyDto.slug || createCompanyDto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await this.prisma.company.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Company with slug "${slug}" already exists`);
    }

    return this.prisma.company.create({
      data: {
        ...createCompanyDto,
        slug,
      },
    });
  }
}
