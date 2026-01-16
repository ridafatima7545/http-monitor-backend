import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PingService } from '../ping/ping.service';

@Injectable()
export class PingJob {
  private readonly logger = new Logger(PingJob.name);

  constructor(private readonly pingService: PingService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.log('🕐 Cron job triggered - executing automated ping');
    await this.pingService.executePing();
  }
}
