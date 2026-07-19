import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { Service } from '../../service/entities/service.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';

export enum SubscriptionDiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column()
  name: string;

  @Column({ name: 'duration_months', type: 'int' })
  durationMonths: number;

  @Column({ name: 'included_appointments', type: 'int' })
  includedAppointments: number;

  @Column({ name: 'discount_type', default: SubscriptionDiscountType.PERCENT })
  discountType: string;

  @Column({
    name: 'discount_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountValue: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /** Future multi-service bundles — not used in Sprint 5 UI */
  @Column({ name: 'bundle_service_ids', type: 'jsonb', nullable: true })
  bundleServiceIds: string[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum CustomerSubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  EXHAUSTED = 'exhausted',
  CANCELLED = 'cancelled',
}

@Entity('customer_subscriptions')
export class CustomerSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => SubscriptionPlan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({ name: 'appointments_included', type: 'int' })
  appointmentsIncluded: number;

  @Column({ name: 'appointments_remaining', type: 'int' })
  appointmentsRemaining: number;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ default: CustomerSubscriptionStatus.ACTIVE })
  status: string;

  @Column({
    name: 'price_paid',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  pricePaid: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum SubscriptionUsageAction {
  CONSUME = 'consume',
  RESTORE = 'restore',
}

@Entity('subscription_usage')
export class SubscriptionUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @ManyToOne(() => CustomerSubscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: CustomerSubscription;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId: string | null;

  @Column({ name: 'service_id' })
  serviceId: string;

  @Column({ default: SubscriptionUsageAction.CONSUME })
  action: string;

  @Column({ name: 'appointments_remaining_after', type: 'int' })
  appointmentsRemainingAfter: number;

  @CreateDateColumn()
  createdAt: Date;
}
