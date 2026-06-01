import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import type { GiftCardModifyPayload } from '../gift-card-order.types.js';

export type GiftCardChangeRequestType = 'cancel' | 'modify';
export type GiftCardChangeRequestStatus =
  | 'pending'
  | 'in_review'
  | 'needs_info'
  | 'completed'
  | 'denied';

@Entity('gift_card_change_requests')
@Index(['businessId', 'status', 'createdAt'])
@Index(['giftCardId', 'createdAt'])
export class GiftCardChangeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'gift_card_id' })
  giftCardId: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'request_type', type: 'varchar', length: 16 })
  requestType: GiftCardChangeRequestType;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: GiftCardChangeRequestStatus;

  @Column({ name: 'modify_payload', type: 'jsonb', nullable: true })
  modifyPayload: GiftCardModifyPayload | null;

  @Column({ name: 'customer_notes', type: 'text', nullable: true })
  customerNotes: string | null;

  @Column({ name: 'specialist_notes', type: 'text', nullable: true })
  specialistNotes: string | null;

  @Column({ name: 'zendesk_ticket_id', nullable: true })
  zendeskTicketId: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
