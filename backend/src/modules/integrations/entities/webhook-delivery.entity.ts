import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { WebhookSubscription } from './webhook-subscription.entity.js';

@Entity('webhook_deliveries')
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WebhookSubscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: WebhookSubscription;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ name: 'event_id', type: 'uuid', nullable: true })
  eventId: string | null;

  @Column({ name: 'http_status', type: 'int', nullable: true })
  httpStatus: number | null;

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'success' | 'failed';

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'attempt_count', type: 'int', default: 1 })
  attemptCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
