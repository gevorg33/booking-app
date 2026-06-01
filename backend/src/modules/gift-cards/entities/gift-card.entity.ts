import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { GiftCardServiceCredit } from './gift-card-service-credit.entity.js';
import { GiftCardRedemption } from './gift-card-redemption.entity.js';
import type {
  GiftCardDeliveryMethod,
  GiftCardFulfillmentStatus,
  GiftCardShippingAddress,
  GiftCardType,
} from '../gift-card.types.js';

@Entity('gift_cards')
@Index(['businessId', 'code'], { unique: true })
export class GiftCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column()
  code: string;

  @Column({ name: 'card_type', default: 'monetary' })
  cardType: GiftCardType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  initialBalance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balance: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ name: 'purchaser_customer_id', type: 'uuid', nullable: true })
  purchaserCustomerId: string | null;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'purchaser_customer_id' })
  purchaser: Customer | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'delivery_method', nullable: true })
  deliveryMethod: GiftCardDeliveryMethod | null;

  @Column({ name: 'fulfillment_status', nullable: true })
  fulfillmentStatus: GiftCardFulfillmentStatus | null;

  @Column({ name: 'recipient_name', nullable: true })
  recipientName: string | null;

  @Column({ name: 'recipient_email', nullable: true })
  recipientEmail: string | null;

  @Column({ name: 'recipient_phone', nullable: true })
  recipientPhone: string | null;

  @Column({ name: 'purchaser_email', nullable: true })
  purchaserEmail: string | null;

  @Column({ name: 'personal_message', type: 'text', nullable: true })
  personalMessage: string | null;

  @Column({ name: 'shipping_address', type: 'jsonb', nullable: true })
  shippingAddress: GiftCardShippingAddress | null;

  @Column({ name: 'shipping_method', nullable: true })
  shippingMethod: string | null;

  @Column({ name: 'purchase_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchaseAmount: number | null;

  @Column({ name: 'shipping_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingFee: number;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId: string | null;

  @Column({ name: 'code_revealed', default: true })
  codeRevealed: boolean;

  @Column({ name: 'card_creator_staff_id', type: 'uuid', nullable: true })
  cardCreatorStaffId: string | null;

  @Column({ name: 'delivery_staff_id', type: 'uuid', nullable: true })
  deliveryStaffId: string | null;

  @Column({ name: 'tracking_carrier', nullable: true })
  trackingCarrier: string | null;

  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber: string | null;

  @Column({ name: 'card_ready_at', type: 'timestamptz', nullable: true })
  cardReadyAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'zendesk_ticket_id', nullable: true })
  zendeskTicketId: string | null;

  @Column({ name: 'stripe_session_id', nullable: true })
  stripeSessionId: string | null;

  @OneToMany(() => GiftCardServiceCredit, (credit) => credit.giftCard)
  serviceCredits: GiftCardServiceCredit[];

  @OneToMany(() => GiftCardRedemption, (redemption) => redemption.giftCard)
  redemptions: GiftCardRedemption[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
