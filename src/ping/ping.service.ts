import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { HttpResponse } from '../entities/http-response.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);
  private readonly HTTPBIN_URL = 'https://httpbin.org/anything';

  constructor(
    @InjectRepository(HttpResponse)
    private readonly responseRepository: Repository<HttpResponse>,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Generate a random JSON payload for the HTTP request
   */
  generateRandomPayload(): any {
    const types = ['A', 'B', 'C', 'D', 'E'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    return {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
      data: {
        value: Math.random() * 100,
        type: randomType,
        isActive: Math.random() > 0.5,
        nested: {
          flag: Math.random() > 0.5,
          count: Math.floor(Math.random() * 1000),
          tags: this.generateRandomTags(),
        },
      },
      metadata: {
        source: 'http-monitor',
        version: '1.0.0',
      },
    };
  }

  /**
   * Generate random tags array
   */
  private generateRandomTags(): string[] {
    const allTags = ['monitoring', 'test', 'production', 'staging', 'development'];
    const count = Math.floor(Math.random() * 3) + 1;
    const shuffled = allTags.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Execute ping to httpbin.org and save the response
   */
  async executePing(): Promise<HttpResponse> {
    const payload = this.generateRandomPayload();
    const startTime = Date.now();

    try {
      this.logger.log('Executing ping to httpbin.org...');

      const response = await axios.post(this.HTTPBIN_URL, payload, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseTime = Date.now() - startTime;

      this.logger.log(
        `Ping successful - Status: ${response.status}, Time: ${responseTime}ms`,
      );

      // Save to database
      const httpResponse = await this.saveResponse({
        timestamp: new Date(),
        requestPayload: payload,
        responseData: response.data,
        statusCode: response.status,
        responseTime,
        headers: response.headers,
      });

      // Broadcast to connected WebSocket clients
      this.websocketGateway.broadcastNewResponse(httpResponse);

      return httpResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Ping failed', error);

      // Handle errors gracefully - still save the error response
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const errorResponse = await this.saveResponse({
          timestamp: new Date(),
          requestPayload: payload,
          responseData: {
            error: true,
            message: axiosError.message,
            code: axiosError.code,
            response: axiosError.response?.data || null,
          },
          statusCode: axiosError.response?.status || 0,
          responseTime,
          headers: axiosError.response?.headers || {},
        });

        this.websocketGateway.broadcastNewResponse(errorResponse);
        return errorResponse;
      }

      throw error;
    }
  }

  /**
   * Save HTTP response to database
   */
  private async saveResponse(data: {
    timestamp: Date;
    requestPayload: any;
    responseData: any;
    statusCode: number;
    responseTime: number;
    headers: any;
  }): Promise<HttpResponse> {
    const response = this.responseRepository.create(data);
    return await this.responseRepository.save(response);
  }

  /**
   * Get all responses with pagination
   */
  async findAll(page: number = 1, limit: number = 20) {
    const [data, total] = await this.responseRepository.findAndCount({
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single response by ID
   */
  async findOne(id: string): Promise<HttpResponse | null> {
    return await this.responseRepository.findOne({ where: { id } });
  }

  /**
   * Get the latest response
   */
  async findLatest(): Promise<HttpResponse | null> {
    return await this.responseRepository.findOne({
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * Get statistics for anomaly detection
   */
  async getStats(windowHours: number = 24) {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const responses = await this.responseRepository.find({
      where: {
        timestamp: since as any, // TypeORM MoreThan equivalent
      },
      order: { timestamp: 'ASC' },
    });

    if (responses.length === 0) {
      return {
        count: 0,
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        windowHours,
      };
    }

    const responseTimes = responses.map((r) => r.responseTime);
    const mean = this.calculateMean(responseTimes);
    const stdDev = this.calculateStdDev(responseTimes, mean);

    return {
      count: responses.length,
      mean,
      stdDev,
      min: Math.min(...responseTimes),
      max: Math.max(...responseTimes),
      windowHours,
    };
  }

  /**
   * Calculate mean (average)
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }
}
