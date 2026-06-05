import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('booking_checkout_drafts')
@Index(['stripeSessionId'])
export class BookingCheckoutDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'stripe_session_id', type: 'varchar', nullable: true })
  stripeSessionId: string | null;

  @Column({
    name: 'stripe_connect_account_id',
    type: 'varchar',
    nullable: true,
  })
  stripeConnectAccountId: string | null;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'completed' | 'expired';

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
