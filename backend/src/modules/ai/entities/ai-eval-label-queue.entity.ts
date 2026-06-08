import type { AiWorstPromptFailureSignals } from '../ai-platform.util.js';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type AiEvalLabelQueueStatus =
  | 'pending'
  | 'labeled'
  | 'dismissed'
  | 'exported';

export type AiEvalLabelQueueSource =
  | 'harvest'
  | 'worst_prompts'
  | 'clarify_quality'
  | 'escalation';

export type AiEvalLabelOutcome = 'execution' | 'clarify';

@Entity('ai_eval_label_queue')
@Index('idx_ai_eval_label_queue_business_status', ['businessId', 'status'])
@Index('idx_ai_eval_label_queue_business_hash', ['businessId', 'promptHash'], {
  unique: true,
})
export class AiEvalLabelQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ name: 'prompt_hash', type: 'varchar', length: 64 })
  promptHash: string;

  @Column({ name: 'prompt_snippet', type: 'text' })
  promptSnippet: string;

  @Column({ type: 'varchar', length: 16, default: 'en' })
  locale: string;

  @Column({ type: 'varchar', length: 32, default: 'dashboard' })
  surface: string;

  @Column({ name: 'classified_action', type: 'varchar', length: 128 })
  classifiedAction: string;

  @Column({ name: 'corrected_action', type: 'varchar', length: 128, nullable: true })
  correctedAction: string | null;

  @Column({ type: 'float', nullable: true })
  confidence: number | null;

  @Column({ name: 'failure_count', type: 'int', default: 1 })
  failureCount: number;

  @Column({ name: 'failure_signals', type: 'jsonb', nullable: true })
  failureSignals: AiWorstPromptFailureSignals | null;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: AiEvalLabelQueueStatus;

  @Column({ name: 'expected_action', type: 'varchar', length: 128, nullable: true })
  expectedAction: string | null;

  @Column({
    name: 'expected_rescued_action',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  expectedRescuedAction: string | null;

  @Column({ name: 'expected_params', type: 'jsonb', nullable: true })
  expectedParams: Record<string, unknown> | null;

  @Column({ name: 'label_outcome', type: 'varchar', length: 16, default: 'execution' })
  labelOutcome: AiEvalLabelOutcome;

  @Column({ name: 'rescue_from_action', type: 'varchar', length: 128, nullable: true })
  rescueFromAction: string | null;

  @Column({ name: 'expected_clarify_fields', type: 'jsonb', nullable: true })
  expectedClarifyFields: string[] | null;

  @Column({ name: 'eval_case_id', type: 'varchar', length: 128, nullable: true })
  evalCaseId: string | null;

  /** acc-6.2 — failure → fix pipeline tracking. */
  @Column({ name: 'fix_type', type: 'varchar', length: 16, nullable: true })
  fixType: string | null;

  @Column({ name: 'fix_status', type: 'varchar', length: 16, nullable: true })
  fixStatus: string | null;

  @Column({ name: 'fix_ref', type: 'varchar', length: 256, nullable: true })
  fixRef: string | null;

  @Column({ name: 'closure_summary', type: 'text', nullable: true })
  closureSummary: string | null;

  @Column({ name: 'closure_applied_at', type: 'timestamptz', nullable: true })
  closureAppliedAt: Date | null;

  @Column({ name: 'labeled_by', type: 'uuid', nullable: true })
  labeledBy: string | null;

  @Column({ name: 'labeled_at', type: 'timestamptz', nullable: true })
  labeledAt: Date | null;

  @Column({ type: 'varchar', length: 32, default: 'harvest' })
  source: AiEvalLabelQueueSource;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
