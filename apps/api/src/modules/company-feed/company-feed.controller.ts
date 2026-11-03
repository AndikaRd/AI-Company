import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { CompanyFeedService } from './company-feed.service';
import { DispatchCeoCommandDto, FeedQueryDto } from './dto/ceo-command.dto';

@Controller('company-feed')
export class CompanyFeedController {
  constructor(private readonly feedService: CompanyFeedService) {}

  @Get()
  async getGlobalFeed(@Query() query: FeedQueryDto) {
    const data = await this.feedService.getGlobalFeed(query);
    return {
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('ceo-command')
  async dispatchCeoCommand(@Body() dto: DispatchCeoCommandDto) {
    const data = await this.feedService.dispatchCeoCommand(dto);
    return {
      success: true,
      data,
      message: 'CEO directive dispatched and acknowledged',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ceo-commands')
  async getCeoCommandHistory(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.feedService.getCeoCommandHistory(limitNum);
    return {
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString(),
    };
  }
}

