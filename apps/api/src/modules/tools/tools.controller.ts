import { Controller, Get } from '@nestjs/common';
import { ToolRegistryService } from './tool-registry.service';

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolRegistry: ToolRegistryService) {}

  @Get()
  listTools() {
    return {
      success: true,
      data: this.toolRegistry.getToolsSummary(),
      timestamp: new Date().toISOString(),
    };
  }
}
