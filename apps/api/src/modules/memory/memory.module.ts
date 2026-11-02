import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { MemoryIngestionService } from './memory-ingestion.service';
import { MemoryRetrievalService } from './memory-retrieval.service';
import { OllamaEmbeddingProvider } from './providers/ollama-embedding.provider';
import { MemoryController } from './memory.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [MemoryController],
  providers: [MemoryIngestionService, MemoryRetrievalService, OllamaEmbeddingProvider],
  exports: [MemoryIngestionService, MemoryRetrievalService, OllamaEmbeddingProvider],
})
export class MemoryModule {}
