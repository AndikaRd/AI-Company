import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthCheckResponse } from '@vac/shared';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async checkHealth(): Promise<HealthCheckResponse> {
    const dbPing = await this.prisma.ping();

    const isHealthy = dbPing.connected;

    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbPing.connected ? 'connected' : 'error',
        latencyMs: dbPing.latencyMs >= 0 ? dbPing.latencyMs : undefined,
      },
      version: '0.1.0',
    };
  }
}
