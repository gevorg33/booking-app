import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import type { PipelineTrace } from '../command-completion.types.js';

export type AiCommandTraceOutcome =
  | 'executed'
  | 'clarified'
  | 'approval'
  | 'failed'
  | 'security_blocked';

export type AiCommandTraceSource = 'deterministic' | 'llm';

export type AiCommandFailureSignal =
  | 'suspected_miss'
  | 'clarify_abandoned'
  | 'wrong_execution'
  | 'human_escalation';

export type AiCommandFeedbackRating = 'up' | 'down';

export type AiCommandFeedbackReason =
  | 'wrong_action'
  | 'wrong_date'
  | 'wrong_person'
  | 'wrong_service'
  | 'did_not_understand';

@Entity('ai_command_trace')
@Index('idx_ai_command_trace_business_created', ['businessId', 'createdAt'])
@Index('idx_ai_command_trace_surface_action', ['surface', 'action'])
@Index('idx_ai_command_trace_outcome', ['outcome'])
@Index('idx_ai_command_trace_trace_id', ['traceId'], { unique: true })
export class AiCommandTrace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trace_id', type: 'uuid' })
  traceId: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ type: 'varchar', length: 32 })
  surface: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  role: string | null;

  @Column({ name: 'raw_prompt', type: 'text' })
  rawPrompt: string;

  @Column({ name: 'normalized_prompt', type: 'text', nullable: true })
  normalizedPrompt: string | null;

  @Column({ type: 'varchar', length: 16, default: 'en' })
  locale: string;

  @Column({ type: 'varchar', length: 128 })
  action: string;

  @Column({ type: 'float', nullable: true })
  confidence: number | null;

  @Column({ type: 'jsonb', nullable: true })
  params: Record<string, unknown> | null;

  @Column({ name: 'routing_tier', type: 'varchar', length: 32, nullable: true })
  routingTier: string | null;

  @Column({ type: 'varchar', length: 16, default: 'llm' })
  source: AiCommandTraceSource;

  @Column({ type: 'varchar', length: 32 })
  outcome: AiCommandTraceOutcome;

  @Column({ name: 'latency_ms', type: 'int', nullable: true })
  latencyMs: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  model: string | null;

  @Column({ name: 'token_cost', type: 'float', nullable: true })
  tokenCost: number | null;

  @Column({ name: 'pipeline_stages', type: 'jsonb', nullable: true })
  pipelineStages: PipelineTrace[] | null;

  @Column({ name: 'failure_signal', type: 'varchar', length: 32, nullable: true })
  failureSignal: AiCommandFailureSignal | null;

  @Column({ name: 'feedback_rating', type: 'varchar', length: 8, nullable: true })
  feedbackRating: AiCommandFeedbackRating | null;

  @Column({ name: 'feedback_reason', type: 'varchar', length: 32, nullable: true })
  feedbackReason: AiCommandFeedbackReason | null;

  @Column({ name: 'corrected_action', type: 'varchar', length: 128, nullable: true })
  correctedAction: string | null;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @Column({ name: 'ab_variant_id', type: 'varchar', length: 64, nullable: true })
  abVariantId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
