import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type AiGuideTelemetrySurface =
  | 'dashboard'
  | 'provider'
  | 'customer'
  | 'public';

export type AiGuideTelemetryEvent =
  | 'topic_opened'
  | 'step_completed'
  | 'handoff_to_action'
  | 'grounding_failure';

@Entity('ai_guide_telemetry')
@Index('idx_ai_guide_telemetry_business_created', ['businessId', 'createdAt'])
@Index('idx_ai_guide_telemetry_surface_event', ['surface', 'event'])
@Index('idx_ai_guide_telemetry_topic', ['topicId'])
export class AiGuideTelemetry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ type: 'varchar', length: 16 })
  surface: AiGuideTelemetrySurface;

  @Column({ type: 'varchar', length: 32 })
  event: AiGuideTelemetryEvent;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'topic_id', type: 'varchar', length: 128, nullable: true })
  topicId: string | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  route: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  locale: string | null;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId: string | null;

  @Column({ name: 'step_index', type: 'int', nullable: true })
  stepIndex: number | null;

  @Column({ name: 'total_steps', type: 'int', nullable: true })
  totalSteps: number | null;

  @Column({
    name: 'handoff_action',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  handoffAction: string | null;

  @Column({ name: 'related_actions_count', type: 'int', nullable: true })
  relatedActionsCount: number | null;

  @Column({ name: 'issue_codes', type: 'jsonb', nullable: true })
  issueCodes: string[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
