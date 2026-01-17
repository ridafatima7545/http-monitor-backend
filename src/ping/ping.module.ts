import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PingService } from './ping.service';
import { PingController } from './ping.controller';
import { HttpResponse } from '../entities/http-response.entity';
import { WebsocketModule } from '../websocket/websocket.module';
import { AnomalyDetectionModule } from '../anomaly-detection/anomaly-detection.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HttpResponse]),
    WebsocketModule,
    AnomalyDetectionModule,
  ],
  controllers: [PingController],
  providers: [PingService],
  exports: [PingService],
})
export class PingModule {}
