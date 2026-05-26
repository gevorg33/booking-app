import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { WorkflowStatus, WorkflowStep, StepStatus } from './interfaces/workflow.interfaces.js';

@Entity('workflow_executions')
@Index(['businessId', 'status'])
export class WorkflowExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  businessId: string;

  @Column({ type: 'enum', enum: WorkflowStatus, default: WorkflowStatus.PENDING })
  status: WorkflowStatus;

  @Column({ type: 'jsonb' })
  steps: WorkflowStep[];

  @Column({ type: 'jsonb', default: {} })
  stepResults: Record<string, {
    status: StepStatus;
    result?: any;
    error?: string;
    startedAt?: string;
    completedAt?: string;
  }>;

  @Column({ type: 'jsonb', default: {} })
  context: Record<string, any>;

  @Column()
  triggeredBy: string;

  @Column({ nullable: true })
  correlationId: string;

  @Column({ nullable: true })
  error: string;

  @CreateDateColumn()
  startedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;
}
