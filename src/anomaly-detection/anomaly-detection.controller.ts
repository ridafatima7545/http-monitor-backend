import { Controller, Get, Query, Param, Patch } from '@nestjs/common';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { StatisticsService } from './statistics.service';
import { ForecastingService } from './forecasting.service';
import { AnomalySeverity } from '../entities/anomaly.entity';

@Controller('api')
export class AnomalyDetectionController {
  constructor(
    private readonly anomalyDetectorService: AnomalyDetectorService,
    private readonly statisticsService: StatisticsService,
    private readonly forecastingService: ForecastingService,
  ) {}

  @Get('anomalies')
  async getAnomalies(
    @Query('limit') limit?: string,
    @Query('severity') severity?: AnomalySeverity,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const anomalies = await this.anomalyDetectorService.getAnomalies(
      limitNum,
      severity,
    );

    return {
      data: anomalies,
      meta: {
        count: anomalies.length,
        severity: severity || 'all',
      },
    };
  }

  @Patch('anomalies/:id/acknowledge')
  async acknowledgeAnomaly(@Param('id') id: string) {
    const anomaly = await this.anomalyDetectorService.acknowledgeAnomaly(id);
    return { data: anomaly };
  }

  @Get('statistics')
  async getStatistics(@Query('windowHours') windowHours?: string) {
    const hours = windowHours ? parseInt(windowHours, 10) : 24;
    const statistics = await this.statisticsService.getLatestStatistics(hours);

    return { data: statistics };
  }

  @Get('statistics/history')
  async getStatisticsHistory(
    @Query('windowHours') windowHours?: string,
    @Query('limit') limit?: string,
  ) {
    const hours = windowHours ? parseInt(windowHours, 10) : 24;
    const limitNum = limit ? parseInt(limit, 10) : 100;

    const history = await this.statisticsService.getStatisticsHistory(
      hours,
      limitNum,
    );

    return {
      data: history,
      meta: {
        count: history.length,
        windowHours: hours,
      },
    };
  }

  @Get('predictions')
  async getPredictions(@Query('windowHours') windowHours?: string) {
    const hours = windowHours ? parseInt(windowHours, 10) : 24;
    const prediction = await this.forecastingService.predictNextValue(hours);

    return { data: prediction };
  }

  @Get('predictions/sma')
  async getSMAPrediction(
    @Query('windowHours') windowHours?: string,
    @Query('period') period?: string,
  ) {
    const hours = windowHours ? parseInt(windowHours, 10) : 24;
    const periodNum = period ? parseInt(period, 10) : 10;

    const prediction = await this.forecastingService.predictWithSMA(
      hours,
      periodNum,
    );

    return { data: prediction };
  }

  @Get('confidence-bands')
  async getConfidenceBands(@Query('windowHours') windowHours?: string) {
    const hours = windowHours ? parseInt(windowHours, 10) : 24;
    const statistics = await this.statisticsService.getLatestStatistics(hours);

    return {
      data: {
        mean: statistics.mean,
        lower: statistics.confidenceLower,
        upper: statistics.confidenceUpper,
        confidenceLevel: statistics.confidenceLevel,
        stdDev: statistics.stdDev,
      },
    };
  }
}
