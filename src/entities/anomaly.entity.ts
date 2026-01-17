import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HttpResponse } from './http-response.entity';

export enum AnomalyType {
  Z_SCORE = 'z-score',
  THRESHOLD = 'threshold',
  PREDICTION_ERROR = 'prediction-error',
}

export enum AnomalySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('anomalies')
export class Anomaly {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date;

  @ManyToOne(() => HttpResponse, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_id' })
  response: HttpResponse;

  @Column({ type: 'uuid' })
  @Index()
  responseId: string;

  @Column({
    type: 'enum',
    enum: AnomalyType,
  })
  @Index()
  type: AnomalyType;

  @Column({
    type: 'enum',
    enum: AnomalySeverity,
  })
  @Index()
  severity: AnomalySeverity;

  @Column({ type: 'float' })
  actualValue: number;

  @Column({ type: 'float' })
  expectedValue: number;

  @Column({ type: 'float' })
  deviation: number;

  @Column({ type: 'float', nullable: true })
  zScore: number;

  @Column({ type: 'float', nullable: true })
  threshold: number;

  @Column({ type: 'boolean', default: false })
  @Index()
  acknowledged: boolean;

  @Column({ type: 'boolean', default: false })
  @Index()
  alertTriggered: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
