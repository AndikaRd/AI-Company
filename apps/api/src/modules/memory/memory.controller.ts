import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { MemoryIngestionService } from './memory-ingestion.service';
import { MemoryRetrievalService } from './memory-retrieval.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMemoryDto,
  UpdateMemoryDto,
  QueryMemoryDto,
  CreateKnowledgeDocumentDto,
} from './dto/memory.dto';
import { KnowledgeCategory } from '@prisma/client';

@Controller('memory')
export class MemoryController {
  constructor(
    private readonly ingestionService: MemoryIngestionService,
    private readonly retrievalService: MemoryRetrievalService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Search active memories with query string, category, scope, and optional employee scope
   */
  @Get('search')
  async searchMemories(@Query() query: QueryMemoryDto) {
    const result = await this.retrievalService.searchMemories({
      requestingEmployeeId: query.employeeId,
      query: query.query,
      category: query.category,
      scope: query.scope,
      status: query.status,
      limit: query.limit || 20,
      offset: query.offset || 0,
    });

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retrieves memories specifically for an employee profile view (private + shared)
   */
  @Get('employee/:employeeId')
  async getEmployeeMemories(
    @Param('employeeId') employeeId: string,
    @Query() query: QueryMemoryDto,
  ) {
    const memories = await this.prisma.memory.findMany({
      where: {
        OR: [
          { ownerEmployeeId: employeeId },
          { scope: 'COMPANY_SHARED', status: 'ACTIVE' },
          { scope: 'PROJECT_SHARED', status: 'ACTIVE' },
        ],
        status: query.status || 'ACTIVE',
        ...(query.category ? { category: query.category } : {}),
      },
      include: {
        source: true,
        ownerEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            employeeCode: true,
          },
        },
      },
      orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
      take: query.limit || 50,
    });

    const working = memories.filter((m) => m.category === 'WORKING');
    const episodic = memories.filter((m) => m.category === 'EPISODIC');
    const semantic = memories.filter((m) => m.category === 'SEMANTIC');

    return {
      success: true,
      data: {
        total: memories.length,
        working,
        episodic,
        semantic,
        all: memories,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retrieves all verified company knowledge documents
   */
  @Get('knowledge/documents')
  async getKnowledgeDocuments(@Query('category') category?: KnowledgeCategory) {
    const where: any = { isApproved: true };
    if (category) {
      where.category = category;
    }

    const documents = await this.prisma.knowledgeDocument.findMany({
      where,
      include: {
        authorEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            employeeCode: true,
          },
        },
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: documents,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retrieve a specific knowledge document by slug
   */
  @Get('knowledge/documents/:slug')
  async getKnowledgeDocumentBySlug(@Param('slug') slug: string) {
    const doc = await this.prisma.knowledgeDocument.findUnique({
      where: { slug },
      include: { authorEmployee: true, department: true },
    });

    if (!doc) {
      throw new NotFoundException(`Knowledge document with slug '${slug}' not found.`);
    }

    return {
      success: true,
      data: doc,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a new verified knowledge document
   */
  @Post('knowledge/documents')
  @HttpCode(HttpStatus.CREATED)
  async createKnowledgeDocument(@Body() dto: CreateKnowledgeDocumentDto) {
    const doc = await this.prisma.knowledgeDocument.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        category: dto.category || 'GENERAL',
        content: dto.content,
        summary: dto.summary || null,
        authorEmployeeId: dto.authorEmployeeId || null,
        departmentId: dto.departmentId || null,
        tags: (dto.tags as any) || [],
        isApproved: true,
      },
    });

    return {
      success: true,
      data: doc,
      message: 'Knowledge document created successfully.',
    };
  }

  /**
   * Retrieve memory access audit logs
   */
  @Get('access-logs')
  async getAccessLogs(@Query('limit') limit = 50) {
    const logs = await this.prisma.memoryAccessLog.findMany({
      include: {
        memory: {
          select: { id: true, title: true, category: true, scope: true },
        },
        accessedByEmployee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    return {
      success: true,
      data: logs,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ingest a new memory
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMemory(@Body() dto: CreateMemoryDto) {
    const memory = await this.ingestionService.createMemory(dto);
    return {
      success: true,
      data: memory,
      message: 'Memory ingested successfully.',
    };
  }

  /**
   * Retrieve single memory detail with ownership access control
   */
  @Get(':id')
  async getMemoryById(
    @Param('id') id: string,
    @Query('requestingEmployeeId') requestingEmployeeId?: string,
  ) {
    const memory = await this.retrievalService.getMemoryById(id, requestingEmployeeId);
    return {
      success: true,
      data: memory,
    };
  }

  /**
   * Update memory
   */
  @Patch(':id')
  async updateMemory(@Param('id') id: string, @Body() dto: UpdateMemoryDto) {
    const updated = await this.ingestionService.updateMemory(id, dto);
    return {
      success: true,
      data: updated,
      message: 'Memory updated successfully.',
    };
  }

  /**
   * Archive memory
   */
  @Post(':id/archive')
  async archiveMemory(@Param('id') id: string, @Body('reason') reason?: string) {
    const archived = await this.ingestionService.archiveMemory(id, reason);
    return {
      success: true,
      data: archived,
      message: 'Memory archived successfully.',
    };
  }

  /**
   * Delete memory
   */
  @Delete(':id')
  async deleteMemory(@Param('id') id: string, @Query('hard') hard = false) {
    await this.ingestionService.deleteMemory(id, hard);
    return {
      success: true,
      message: `Memory ${id} ${hard ? 'permanently purged' : 'marked deleted'}.`,
    };
  }
}

