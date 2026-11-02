import { Module } from '@nestjs/common';
import { ToolRegistryService } from './tool-registry.service';
import { ToolsController } from './tools.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ToolsController],
  providers: [ToolRegistryService],
  exports: [ToolRegistryService],
})
export class ToolsModule {}
