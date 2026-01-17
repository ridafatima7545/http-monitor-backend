import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PingModule } from './ping/ping.module';
import { ResponsesModule } from './responses/responses.module';
import { WebsocketModule } from './websocket/websocket.module';
import { JobsModule } from './jobs/jobs.module';
import { AnomalyDetectionModule } from './anomaly-detection/anomaly-detection.module';
import { HttpResponse } from './entities/http-response.entity';
import { Anomaly } from './entities/anomaly.entity';
import { Statistic } from './entities/statistic.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [HttpResponse, Anomaly, Statistic],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    }),
    ScheduleModule.forRoot(),
    PingModule,
    ResponsesModule,
    WebsocketModule,
    JobsModule,
    AnomalyDetectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
