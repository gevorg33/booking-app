import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';

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

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  initialBalance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balance: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ name: 'purchaser_customer_id', type: 'uuid', nullable: true })
  purchaserCustomerId: string;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'purchaser_customer_id' })
  purchaser: Customer;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
