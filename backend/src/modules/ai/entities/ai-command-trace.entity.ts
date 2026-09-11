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
// Follow-up resolution reads one conversation in order; that is the only
// access pattern this column has.
@Index('idx_ai_command_trace_session', ['sessionId', 'createdAt'])
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

  /**
   * AI-ROADMAP Phase 3 — plan telemetry. Null on every row produced by the
   * legacy single-action pipeline, which is itself the shadow-rollout signal:
   * a non-null `plan_outcome` means the planner handled this message.
   */
  @Column({ name: 'plan_outcome', type: 'varchar', length: 16, nullable: true })
  planOutcome: string | null;

  /** How many commands the planner extracted from one message. */
  @Column({ name: 'plan_step_count', type: 'int', nullable: true })
  planStepCount: number | null;

  /** Command ids in the plan — the shadow-comparison input against `action`. */
  @Column({ name: 'plan_commands', type: 'jsonb', nullable: true })
  planCommands: string[] | null;

  /** Same commands as legacy flat names, so shadow comparison is like-for-like. */
  @Column({ name: 'plan_commands_legacy', type: 'jsonb', nullable: true })
  planCommandsLegacy: string[] | null;

  @Column({
    name: 'plan_highest_risk',
    type: 'varchar',
    length: 4,
    nullable: true,
  })
  planHighestRisk: string | null;

  /** Why the plan could not execute — makes the clarify path measurable. */
  @Column({ name: 'plan_problems', type: 'jsonb', nullable: true })
  planProblems: Record<string, unknown>[] | null;

  /** Syntax repairs the decoder applied — a proxy for model output quality. */
  @Column({ name: 'plan_repairs', type: 'jsonb', nullable: true })
  planRepairs: string[] | null;

  /**
   * Conversation key, derived server-side from the replayed history (§50).
   *
   * Null for anonymous visitors **by design**: without a `user_id` the only
   * hash inputs are the business and the message text, so two strangers opening
   * with the same sentence would collide into one conversation. Also null for
   * rows written before 2026-08-07 — the derivation needs the history that
   * accompanied the request, which was never stored.
   */
  @Column({ name: 'session_id', type: 'varchar', length: 40, nullable: true })
  sessionId: string | null;

  /** User-turn number within the conversation, 1-based. §48 needs this. */
  @Column({ name: 'session_turn', type: 'smallint', nullable: true })
  sessionTurn: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
