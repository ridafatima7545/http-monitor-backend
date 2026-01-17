import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { HttpResponse } from '../entities/http-response.entity';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as stats from 'simple-statistics';

export interface Prediction {
  timestamp: Date;
  predictedValue: number;
  confidenceLower: number;
  confidenceUpper: number;
  method: string;
}

@Injectable()
export class ForecastingService {
  private readonly logger = new Logger(ForecastingService.name);
  private openai: OpenAI | null = null;

  constructor(
    @InjectRepository(HttpResponse)
    private readonly responseRepository: Repository<HttpResponse>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPEN_AI_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized for forecasting');
    } else {
      this.logger.warn(
        'OpenAI API key not found, using statistical methods only',
      );
    }
  }

  async predictNextValue(windowHours: number = 24): Promise<Prediction | null> {
    const responses = await this.getRecentResponses(windowHours);

    if (responses.length < 5) {
      this.logger.warn('Insufficient data for forecasting');
      return null;
    }

    if (this.openai) {
      try {
        return await this.predictWithOpenAI(responses);
      } catch (error) {
        this.logger.error('OpenAI prediction failed, falling back', error);
      }
    }

    return this.predictWithExponentialSmoothing(responses);
  }

  private async predictWithOpenAI(
    responses: HttpResponse[],
  ): Promise<Prediction> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }
    const responseTimes = responses.map((r) => r.responseTime);
    const timestamps = responses.map((r) => r.timestamp.toISOString());

    const prompt = `You are a time-series forecasting expert. Given the following HTTP response times (in milliseconds) with their timestamps, predict the next expected response time.
        Data:
        ${timestamps.map((t, i) => `${t}: ${responseTimes[i]}ms`).join('\n')}

        Analyze the pattern and provide:
        1. Predicted next value (single number in ms)
        2. Confidence interval (lower and upper bounds)

        Respond in JSON format:
        {
        "predicted": <number>,
        "confidenceLower": <number>,
        "confidenceUpper": <number>,
        "reasoning": "<brief explanation>"
    }`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const result = JSON.parse(content);

    this.logger.log(`OpenAI prediction: ${result.predicted}ms`);

    return {
      timestamp: new Date(),
      predictedValue: result.predicted,
      confidenceLower: result.confidenceLower,
      confidenceUpper: result.confidenceUpper,
      method: 'openai-gpt4',
    };
  }

  private predictWithExponentialSmoothing(
    responses: HttpResponse[],
  ): Prediction {
    const responseTimes = responses.map((r) => r.responseTime);
    const alpha = 0.3;

    let smoothed = responseTimes[0];
    for (let i = 1; i < responseTimes.length; i++) {
      smoothed = alpha * responseTimes[i] + (1 - alpha) * smoothed;
    }

    const stdDev = stats.standardDeviation(responseTimes);
    const confidenceInterval = 1.96 * stdDev;

    this.logger.log(
      `Exponential smoothing prediction: ${smoothed.toFixed(2)}ms`,
    );

    return {
      timestamp: new Date(),
      predictedValue: smoothed,
      confidenceLower: Math.max(0, smoothed - confidenceInterval),
      confidenceUpper: smoothed + confidenceInterval,
      method: 'exponential-smoothing',
    };
  }

  async predictWithSMA(
    windowHours: number = 24,
    period: number = 10,
  ): Promise<Prediction | null> {
    const responses = await this.getRecentResponses(windowHours);

    if (responses.length < period) {
      return null;
    }

    const responseTimes = responses.map((r) => r.responseTime);
    const recentValues = responseTimes.slice(-period);
    const sma = stats.mean(recentValues);

    const stdDev = stats.standardDeviation(recentValues);
    const confidenceInterval = 1.96 * stdDev;

    return {
      timestamp: new Date(),
      predictedValue: sma,
      confidenceLower: Math.max(0, sma - confidenceInterval),
      confidenceUpper: sma + confidenceInterval,
      method: 'simple-moving-average',
    };
  }

  async calculatePredictionError(
    prediction: Prediction,
    actual: number,
  ): Promise<number> {
    return Math.abs(prediction.predictedValue - actual);
  }

  private async getRecentResponses(
    windowHours: number,
  ): Promise<HttpResponse[]> {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    return await this.responseRepository.find({
      where: {
        timestamp: MoreThan(since),
      },
      order: { timestamp: 'ASC' },
    });
  }
}
