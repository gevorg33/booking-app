import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('consumer_native_push_tokens')
@Index(['customerId', 'businessId', 'platform'], { unique: true })
export class ConsumerNativePushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ type: 'varchar', length: 512 })
  token: string;

  @Column({ type: 'varchar', length: 16 })
  platform: 'ios' | 'android';

  @Column({ name: 'permission_state', type: 'varchar', length: 24, default: 'full' })
  permissionState: 'full' | 'provisional' | 'default_on';

  @Column({ name: 'analytics_anon_id', type: 'varchar', length: 64, nullable: true })
  analyticsAnonId: string | null;

  @Column({ name: 'delivery_success_count', type: 'int', default: 0 })
  deliverySuccessCount: number;

  @Column({ name: 'delivery_failure_count', type: 'int', default: 0 })
  deliveryFailureCount: number;

  @Column({ name: 'last_delivered_at', type: 'timestamptz', nullable: true })
  lastDeliveredAt: Date | null;

  @Column({ name: 'last_delivery_error', type: 'varchar', length: 255, nullable: true })
  lastDeliveryError: string | null;

  @Column({ name: 'last_fcm_accepted_at', type: 'timestamptz', nullable: true })
  lastFcmAcceptedAt: Date | null;

  @Column({ name: 'last_delivery_ack_at', type: 'timestamptz', nullable: true })
  lastDeliveryAckAt: Date | null;

  @Column({ name: 'last_fcm_message_id', type: 'varchar', length: 128, nullable: true })
  lastFcmMessageId: string | null;

  @Column({ name: 'silent_failure_count', type: 'int', default: 0 })
  silentFailureCount: number;

  @Column({ name: 'token_refreshed_at', type: 'timestamptz', nullable: true })
  tokenRefreshedAt: Date | null;

  @Column({ name: 'last_silent_failure_at', type: 'timestamptz', nullable: true })
  lastSilentFailureAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
