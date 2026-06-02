import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type GiftCardExpirationAuditAction = 'set' | 'extend' | 'clear';

@Entity('gift_card_expiration_audit')
@Index(['giftCardId', 'createdAt'])
export class GiftCardExpirationAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'gift_card_id' })
  giftCardId: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'admin_user_id' })
  adminUserId: string;

  @Column({ type: 'varchar', length: 16 })
  action: GiftCardExpirationAuditAction;

  @Column({ name: 'previous_expires_at', type: 'timestamptz', nullable: true })
  previousExpiresAt: Date | null;

  @Column({ name: 'new_expires_at', type: 'timestamptz', nullable: true })
  newExpiresAt: Date | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
