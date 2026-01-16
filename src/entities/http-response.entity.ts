import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('http_responses')
export class HttpResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date;

  @Column({ type: 'jsonb' })
  requestPayload: any;

  @Column({ type: 'jsonb' })
  responseData: any;

  @Column({ type: 'int' })
  @Index()
  statusCode: number;

  @Column({ type: 'float' })
  @Index()
  responseTime: number;

  @Column({ type: 'jsonb', nullable: true })
  headers: any;

  @CreateDateColumn()
  createdAt: Date;
}
