import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import type { MarketingAutomationKind } from '../marketing-automation.types.js';

@Entity('marketing_automation_logs')
@Index(['businessId', 'customerId', 'kind'])
export class MarketingAutomationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 64 })
  kind: MarketingAutomationKind;

  @Column({ type: 'varchar', length: 16 })
  channel: 'email' | 'sms' | 'push';

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId: string | null;

  @Column({ type: 'varchar', length: 255 })
  recipient: string;

  @Column({ type: 'varchar', length: 16, default: 'sent' })
  status: 'sent' | 'failed' | 'skipped';

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}
