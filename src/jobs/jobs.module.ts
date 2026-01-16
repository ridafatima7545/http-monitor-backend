import { Module } from '@nestjs/common';
import { PingJob } from './ping.job';
import { PingModule } from '../ping/ping.module';

@Module({
  imports: [PingModule],
  providers: [PingJob],
})
export class JobsModule {}
