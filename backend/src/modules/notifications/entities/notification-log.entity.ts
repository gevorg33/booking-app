import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import type {
  NotificationChannel,
  NotificationKind,
} from '../notification.types.js';

@Entity('notification_logs')
@Index(['bookingId', 'kind', 'channel'], { unique: true })
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @Column({ type: 'varchar' })
  channel: NotificationChannel;

  @Column({ type: 'varchar' })
  kind: NotificationKind;

  @Column({ type: 'varchar' })
  recipient: string;

  @Column({ type: 'varchar', default: 'sent' })
  status: 'sent' | 'failed' | 'skipped';

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn()
  sentAt: Date;
}
