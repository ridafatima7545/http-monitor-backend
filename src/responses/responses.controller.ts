import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { PingService } from '../ping/ping.service';
import { QueryResponseDto } from '../dto/query-response.dto';

@Controller('api/responses')
export class ResponsesController {
  constructor(private readonly pingService: PingService) {}

  /**
   * Get all responses with pagination
   */
  @Get()
  async findAll(@Query() query: QueryResponseDto) {
    return await this.pingService.findAll(query.page, query.limit);
  }

  /**
   * Get a single response by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const response = await this.pingService.findOne(id);
    if (!response) {
      throw new NotFoundException(`Response with ID ${id} not found`);
    }
    return response;
  }

  /**
   * Get the latest response (for polling fallback)
   */
  @Get('latest/data')
  async getLatest() {
    const response = await this.pingService.findLatest();
    if (!response) {
      throw new NotFoundException('No responses found');
    }
    return response;
  }

  /**
   * Get statistics for anomaly detection
   */
  @Get('stats/summary')
  async getStats(@Query('windowHours') windowHours?: number) {
    const hours = windowHours ? parseInt(windowHours.toString()) : 24;
    return await this.pingService.getStats(hours);
  }
}
