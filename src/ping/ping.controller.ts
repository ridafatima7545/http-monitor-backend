import { Controller, Post, Logger } from '@nestjs/common';
import { PingService } from './ping.service';

@Controller('api/ping')
export class PingController {
  private readonly logger = new Logger(PingController.name);

  constructor(private readonly pingService: PingService) {}

  /**
   * Trigger a manual ping (used by external cron service)
   */
  @Post('trigger')
  async triggerPing() {
    this.logger.log('Manual ping triggered');
    const response = await this.pingService.executePing();
    return {
      success: true,
      message: 'Ping executed successfully',
      data: response,
    };
  }
}
