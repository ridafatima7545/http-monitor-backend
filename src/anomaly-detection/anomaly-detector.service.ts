import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Anomaly,
  AnomalyType,
  AnomalySeverity,
} from '../entities/anomaly.entity';
import { HttpResponse } from '../entities/http-response.entity';
import { StatisticsService } from './statistics.service';

@Injectable()
export class AnomalyDetectorService {
  private readonly logger = new Logger(AnomalyDetectorService.name);
  private readonly Z_SCORE_THRESHOLD = 3;
  private readonly ABSOLUTE_THRESHOLD_MS = 5000;

  constructor(
    @InjectRepository(Anomaly)
    private readonly anomalyRepository: Repository<Anomaly>,
    private readonly statisticsService: StatisticsService,
  ) {}

  async detectAnomalies(response: HttpResponse): Promise<Anomaly[]> {
    const detectedAnomalies: Anomaly[] = [];

    const statistics = await this.statisticsService.getLatestStatistics(24);

    if (statistics.sampleCount < 10) {
      this.logger.log('Insufficient data for anomaly detection');
      return detectedAnomalies;
    }

    const zScoreAnomaly = await this.detectZScoreAnomaly(response, statistics);
    if (zScoreAnomaly) {
      detectedAnomalies.push(zScoreAnomaly);
    }

    const thresholdAnomaly = await this.detectThresholdAnomaly(response);
    if (thresholdAnomaly) {
      detectedAnomalies.push(thresholdAnomaly);
    }

    if (detectedAnomalies.length > 0) {
      this.logger.warn(
        `Detected ${detectedAnomalies.length} anomalies for response ${response.id}`,
      );
    }

    return detectedAnomalies;
  }

  private async detectZScoreAnomaly(
    response: HttpResponse,
    statistics: any,
  ): Promise<Anomaly | null> {
    if (statistics.stdDev === 0) {
      return null;
    }

    const zScore =
      (response.responseTime - statistics.mean) / statistics.stdDev;

    if (Math.abs(zScore) >= this.Z_SCORE_THRESHOLD) {
      const severity = this.calculateSeverity(Math.abs(zScore));

      const anomaly = this.anomalyRepository.create({
        timestamp: response.timestamp,
        responseId: response.id,
        type: AnomalyType.Z_SCORE,
        severity,
        actualValue: response.responseTime,
        expectedValue: statistics.mean,
        deviation: response.responseTime - statistics.mean,
        zScore,
        alertTriggered: severity === AnomalySeverity.CRITICAL,
        metadata: {
          stdDev: statistics.stdDev,
          threshold: this.Z_SCORE_THRESHOLD,
        },
      });

      return await this.anomalyRepository.save(anomaly);
    }

    return null;
  }

  private async detectThresholdAnomaly(
    response: HttpResponse,
  ): Promise<Anomaly | null> {
    if (response.responseTime >= this.ABSOLUTE_THRESHOLD_MS) {
      const anomaly = this.anomalyRepository.create({
        timestamp: response.timestamp,
        responseId: response.id,
        type: AnomalyType.THRESHOLD,
        severity: AnomalySeverity.HIGH,
        actualValue: response.responseTime,
        expectedValue: this.ABSOLUTE_THRESHOLD_MS,
        deviation: response.responseTime - this.ABSOLUTE_THRESHOLD_MS,
        threshold: this.ABSOLUTE_THRESHOLD_MS,
        alertTriggered: true,
        metadata: {
          thresholdMs: this.ABSOLUTE_THRESHOLD_MS,
        },
      });

      return await this.anomalyRepository.save(anomaly);
    }

    return null;
  }

  private calculateSeverity(zScore: number): AnomalySeverity {
    if (zScore >= 5) return AnomalySeverity.CRITICAL;
    if (zScore >= 4) return AnomalySeverity.HIGH;
    if (zScore >= 3) return AnomalySeverity.MEDIUM;
    return AnomalySeverity.LOW;
  }

  async getAnomalies(
    limit: number = 50,
    severity?: AnomalySeverity,
  ): Promise<Anomaly[]> {
    const where: any = {};
    if (severity) {
      where.severity = severity;
    }

    return await this.anomalyRepository.find({
      where,
      order: { timestamp: 'DESC' },
      take: limit,
      relations: ['response'],
    });
  }

  async acknowledgeAnomaly(id: string): Promise<Anomaly | null> {
    const anomaly = await this.anomalyRepository.findOne({ where: { id } });
    if (anomaly) {
      anomaly.acknowledged = true;
      return await this.anomalyRepository.save(anomaly);
    }
    return null;
  }
}
