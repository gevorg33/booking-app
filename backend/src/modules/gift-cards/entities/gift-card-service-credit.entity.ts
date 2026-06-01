import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { GiftCard } from './gift-card.entity.js';

@Entity('gift_card_service_credits')
export class GiftCardServiceCredit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'gift_card_id' })
  giftCardId: string;

  @ManyToOne(() => GiftCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gift_card_id' })
  giftCard: GiftCard;

  @Column({ name: 'service_id' })
  serviceId: string;

  @Column({ name: 'service_name' })
  serviceName: string;

  @Column({ name: 'quantity_total', type: 'int', default: 1 })
  quantityTotal: number;

  @Column({ name: 'quantity_remaining', type: 'int', default: 1 })
  quantityRemaining: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
