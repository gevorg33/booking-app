import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { GiftCard } from './gift-card.entity.js';

@Entity('gift_card_redemptions')
export class GiftCardRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'gift_card_id' })
  giftCardId: string;

  @ManyToOne(() => GiftCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gift_card_id' })
  giftCard: GiftCard;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number | null;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId: string | null;

  @Column({ name: 'service_name', type: 'varchar', nullable: true })
  serviceName: string | null;

  @Column({ name: 'credits_consumed', type: 'int', default: 0 })
  creditsConsumed: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
