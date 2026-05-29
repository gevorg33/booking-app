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
import { loyaltyDecimalTransformer } from '../loyalty-decimal.transformer.js';

@Entity('loyalty_accounts')
@Index(['businessId', 'customerId'], { unique: true })
export class LoyaltyAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  /** Dollar value of redeemable bonuses (e.g. 0.50 = $0.50 off). */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: loyaltyDecimalTransformer,
  })
  pointsBalance: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: loyaltyDecimalTransformer,
  })
  lifetimeEarned: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => LoyaltyAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: LoyaltyAccount;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: loyaltyDecimalTransformer,
  })
  points: number;

  /** earn | redeem | adjust */
  @Column()
  type: string;

  @Column({ nullable: true })
  bookingId: string;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
