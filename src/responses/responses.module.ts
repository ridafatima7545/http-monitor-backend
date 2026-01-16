import { Module } from '@nestjs/common';
import { ResponsesController } from './responses.controller';
import { PingModule } from '../ping/ping.module';

@Module({
  imports: [PingModule],
  controllers: [ResponsesController],
})
export class ResponsesModule {}
