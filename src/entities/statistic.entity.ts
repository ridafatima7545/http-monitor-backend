import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('statistics')
export class Statistic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  @Index()
  windowStart: Date;

  @Column({ type: 'timestamp' })
  @Index()
  windowEnd: Date;

  @Column({ type: 'int' })
  windowHours: number;

  @Column({ type: 'float' })
  mean: number;

  @Column({ type: 'float' })
  stdDev: number;

  @Column({ type: 'float' })
  min: number;

  @Column({ type: 'float' })
  max: number;

  @Column({ type: 'int' })
  sampleCount: number;

  @Column({ type: 'float', nullable: true })
  confidenceLower: number;

  @Column({ type: 'float', nullable: true })
  confidenceUpper: number;

  @Column({ type: 'float', default: 0.95 })
  confidenceLevel: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
