import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { AiCommandTraceSurface } from './ai-command-trace.entity.js';
import type { CompoundStepOutcome } from '../ai-compound-step-outcome.util.js';

/**
 * AI-ROADMAP Phase 1 — one row per sub-intent of a compound AI command.
 *
 * `ai_command_trace` records a single `action` per message, which cannot
 * describe a multi-command message. `compound_intent` fails 61.8% of the time
 * and nothing said which of its steps broke — so the largest failure bucket on
 * the platform had no diagnosis.
 *
 * Joined to the parent on `trace_id` rather than by a foreign key: the parent
 * is written fire-and-forget on the hot path, and a constraint that can reject
 * a diagnostic insert can turn telemetry into a user-visible error.
 */
@Entity('ai_command_trace_step')
@Index('idx_ai_command_trace_step_trace', ['traceId'])
@Index('idx_ai_command_trace_step_action_outcome', ['action', 'outcome'])
export class AiCommandTraceStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Correlates to `ai_command_trace.trace_id`. */
  @Column({ name: 'trace_id', type: 'uuid' })
  traceId: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ type: 'varchar', length: 16 })
  surface: AiCommandTraceSurface;

  /** Position within the decomposed compound, 0-based. */
  @Column({ name: 'step_index', type: 'int' })
  stepIndex: number;

  @Column({ type: 'varchar', length: 128 })
  action: string;

  @Column({ type: 'varchar', length: 16 })
  outcome: CompoundStepOutcome;

  /** Merged-plan step ids this sub-intent contributed — attribution is by id. */
  @Column({ name: 'plan_step_ids', type: 'jsonb', nullable: true })
  planStepIds: string[] | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
