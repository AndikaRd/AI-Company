import { Controller, Get, Param } from '@nestjs/common';
import { OllamaService } from './ollama.service';

@Controller('ai')
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  @Get('health')
  async getAiHealth() {
    const health = await this.ollamaService.checkHealth();
    return {
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('models')
  async listModels() {
    const models = await this.ollamaService.listModels();
    return {
      success: true,
      data: models,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('models/verify/:modelName')
  async verifyModel(@Param('modelName') modelName: string) {
    const verification = await this.ollamaService.verifyModel(modelName);
    return {
      success: true,
      data: verification,
      timestamp: new Date().toISOString(),
    };
  }
}
