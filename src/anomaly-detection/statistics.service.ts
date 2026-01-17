import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Statistic } from '../entities/statistic.entity';
import { HttpResponse } from '../entities/http-response.entity';
import * as stats from 'simple-statistics';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    @InjectRepository(Statistic)
    private readonly statisticRepository: Repository<Statistic>,
    @InjectRepository(HttpResponse)
    private readonly responseRepository: Repository<HttpResponse>,
  ) {}

  async calculateRollingStatistics(
    windowHours: number = 24,
  ): Promise<Statistic> {
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const windowEnd = new Date();

    this.logger.log(
      `Calculating rolling statistics for ${windowHours}h window`,
    );

    const responses = await this.responseRepository.find({
      where: {
        timestamp: MoreThan(windowStart),
      },
      order: { timestamp: 'ASC' },
    });

    if (responses.length === 0) {
      this.logger.warn('No responses found in time window');
      return this.createEmptyStatistic(windowStart, windowEnd, windowHours);
    }

    const responseTimes = responses.map((r) => r.responseTime);

    const mean = stats.mean(responseTimes);
    const stdDev = stats.standardDeviation(responseTimes);
    const min = stats.min(responseTimes);
    const max = stats.max(responseTimes);

    const confidenceLevel = 0.95;
    const zScore = 1.96; // 95% confidence interval
    const marginOfError = zScore * (stdDev / Math.sqrt(responseTimes.length));

    const statistic = this.statisticRepository.create({
      windowStart,
      windowEnd,
      windowHours,
      mean,
      stdDev,
      min,
      max,
      sampleCount: responseTimes.length,
      confidenceLower: mean - marginOfError,
      confidenceUpper: mean + marginOfError,
      confidenceLevel,
      metadata: {
        median: stats.median(responseTimes),
        variance: stats.variance(responseTimes),
      },
    });

    const saved = await this.statisticRepository.save(statistic);
    this.logger.log(
      `Statistics calculated: mean=${mean.toFixed(2)}ms, stdDev=${stdDev.toFixed(2)}ms`,
    );

    return saved;
  }

  async getLatestStatistics(windowHours: number = 24): Promise<Statistic> {
    const latest = await this.statisticRepository.findOne({
      where: { windowHours },
      order: { createdAt: 'DESC' },
    });

    if (!latest || this.isStale(latest)) {
      return await this.calculateRollingStatistics(windowHours);
    }

    return latest;
  }

  async getStatisticsHistory(
    windowHours: number = 24,
    limit: number = 100,
  ): Promise<Statistic[]> {
    return await this.statisticRepository.find({
      where: { windowHours },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private isStale(statistic: Statistic): boolean {
    const ageMinutes = (Date.now() - statistic.createdAt.getTime()) / 1000 / 60;
    return ageMinutes > 5;
  }

  private createEmptyStatistic(
    windowStart: Date,
    windowEnd: Date,
    windowHours: number,
  ): Statistic {
    return this.statisticRepository.create({
      windowStart,
      windowEnd,
      windowHours,
      mean: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      sampleCount: 0,
      confidenceLower: 0,
      confidenceUpper: 0,
      confidenceLevel: 0.95,
    });
  }
}
