import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import type { PipelineTrace } from '../command-completion.types.js';

export type AiCommandTraceSurface =
  | 'dashboard'
  | 'provider'
  | 'customer'
  | 'public';

export type AiCommandTraceOutcome =
  | 'executed'
  | 'clarified'
  | 'approval'
  | 'failed'
  | 'security_blocked';

export type AiCommandTraceSource = 'deterministic' | 'llm';

export type AiCommandTraceRoutingTier =
  | 'read_only'
  | 'simple_mutate'
  | 'orchestration'
  | 'compound';

@Entity('ai_command_trace')
@Index('idx_ai_command_trace_business_created', ['businessId', 'createdAt'])
@Index('idx_ai_command_trace_surface_action', ['surface', 'action'])
@Index('idx_ai_command_trace_outcome', ['outcome'])
@Index('idx_ai_command_trace_trace_id', ['traceId'])
export class AiCommandTrace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Correlation id across classify→resolve→validate→execute (acc-1.3). */
  @Column({ name: 'trace_id', type: 'uuid' })
  traceId: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ type: 'varchar', length: 16 })
  surface: AiCommandTraceSurface;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  role: string | null;

  @Column({ name: 'prompt_raw', type: 'text' })
  promptRaw: string;

  @Column({ name: 'prompt_normalized', type: 'text' })
  promptNormalized: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  locale: string | null;

  @Column({ type: 'varchar', length: 128 })
  action: string;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidence: number | null;

  @Column({ type: 'jsonb', nullable: true })
  params: Record<string, unknown> | null;

  @Column({ name: 'routing_tier', type: 'varchar', length: 32, nullable: true })
  routingTier: AiCommandTraceRoutingTier | null;

  @Column({ type: 'varchar', length: 16 })
  source: AiCommandTraceSource;

  @Column({ type: 'varchar', length: 24 })
  outcome: AiCommandTraceOutcome;

  @Column({ name: 'latency_ms', type: 'int', nullable: true })
  latencyMs: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  model: string | null;

  @Column({ name: 'prompt_tokens', type: 'int', nullable: true })
  promptTokens: number | null;

  @Column({ name: 'completion_tokens', type: 'int', nullable: true })
  completionTokens: number | null;

  @Column({
    name: 'token_cost_usd',
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
  })
  tokenCostUsd: number | null;

  @Column({ name: 'pipeline_trace', type: 'jsonb', nullable: true })
  pipelineTrace: PipelineTrace[] | null;

  /**
   * AI-ROADMAP Task 1 — steal telemetry.
   * Action chosen by the LLM classifier, before any later stage could replace
   * it. `action` above is what actually ran; when the two differ, a
   * post-classify stage took the decision away.
   */
  @Column({
    name: 'classified_action',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  classifiedAction: string | null;

  /** Pipeline stage that produced the action which ran (null when classify's survived). */
  @Column({
    name: 'action_changed_by',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  actionChangedBy: string | null;

  /** Coarse structured bucket for failures (see `deriveFailureReason`). */
  @Column({
    name: 'failure_reason',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  failureReason: string | null;

  /**
   * Redacted response summary — persisted only for non-executed outcomes.
   * Without it, a failed command leaves no recoverable cause; with it, failure
   * triage does not require reproducing the prompt.
   */
  @Column({ name: 'result_summary', type: 'text', nullable: true })
  resultSummary: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
