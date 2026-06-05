import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type DataBreachIncidentStatus = 'open' | 'notified' | 'closed';

@Entity('data_breach_incidents')
@Index(['businessId', 'reportedAt'])
export class DataBreachIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'reported_by_user_id' })
  reportedByUserId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'affected_customer_count', type: 'int', default: 0 })
  affectedCustomerCount: number;

  @Column({ name: 'draft_email_subject', type: 'text' })
  draftEmailSubject: string;

  @Column({ name: 'draft_email_body', type: 'text' })
  draftEmailBody: string;

  @Column({ name: 'gdpr_notification_deadline_at', type: 'timestamptz' })
  gdprNotificationDeadlineAt: Date;

  @Column({ type: 'varchar', length: 16, default: 'open' })
  status: DataBreachIncidentStatus;

  @CreateDateColumn({ name: 'reported_at', type: 'timestamptz' })
  reportedAt: Date;
}
