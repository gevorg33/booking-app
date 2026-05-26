import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AgentType, PlanStatus } from './interfaces/agent.interfaces.js';
import type { AgentPlan } from './interfaces/agent.interfaces.js';

@Entity('agent_tasks')
@Index(['businessId', 'status'])
export class AgentTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AgentType })
  agentType: AgentType;

  @Column()
  businessId: string;

  @Column()
  intent: string;

  @Column({ type: 'enum', enum: PlanStatus, default: PlanStatus.DRAFT })
  status: PlanStatus;

  @Column({ type: 'jsonb', nullable: true })
  plan: AgentPlan;

  @Column({ type: 'jsonb', default: {} })
  context: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  result: Record<string, any>;

  @Column({ nullable: true })
  workflowExecutionId: string;

  @Column({ nullable: true })
  error: string;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
