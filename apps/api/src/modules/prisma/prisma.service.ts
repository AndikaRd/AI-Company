import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully established PostgreSQL connection via Prisma');
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma database connection disconnected');
  }

  async ping(): Promise<{ connected: boolean; latencyMs: number }> {
    const start = performance.now();
    try {
      await this.$queryRaw`SELECT 1`;
      const latencyMs = Math.round(performance.now() - start);
      return { connected: true, latencyMs };
    } catch (error) {
      this.logger.error('Database ping check failed', error);
      return { connected: false, latencyMs: -1 };
    }
  }
}
