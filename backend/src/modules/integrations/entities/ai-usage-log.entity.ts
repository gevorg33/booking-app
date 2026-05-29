import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import {
  DEFAULT_OPENAI_MODEL,
  type AiActorType,
  type AiKeySource,
  type AiUsageSurface,
} from '../openai/openai.types.js';

@Entity('ai_usage_logs')
@Index(['businessId', 'createdAt'])
export class AiUsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'actor_type', type: 'varchar', length: 32 })
  actorType: AiActorType;

  @Column({ type: 'varchar', length: 32 })
  surface: AiUsageSurface;

  @Column({ type: 'varchar', length: 64 })
  operation: string;

  @Column({ type: 'varchar', length: 64, default: DEFAULT_OPENAI_MODEL })
  model: string;

  @Column({ name: 'prompt_tokens', type: 'int', default: 0 })
  promptTokens: number;

  @Column({ name: 'completion_tokens', type: 'int', default: 0 })
  completionTokens: number;

  @Column({ name: 'total_tokens', type: 'int', default: 0 })
  totalTokens: number;

  @Column({ name: 'estimated_cost_usd', type: 'decimal', precision: 12, scale: 6, default: 0 })
  estimatedCostUsd: string;

  @Column({ name: 'key_source', type: 'varchar', length: 16 })
  keySource: AiKeySource;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
