import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BusinessMember } from './business-member.entity.js';
import { Service } from '../../service/entities/service.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  /** Stripe billing */
  @Column({ type: 'varchar', nullable: true, name: 'stripe_customer_id' })
  stripeCustomerId: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'stripe_subscription_id' })
  stripeSubscriptionId: string | null;

  @Column({ type: 'varchar', default: 'inactive', name: 'subscription_status' })
  subscriptionStatus: string;

  @Column({ type: 'varchar', nullable: true, name: 'subscription_plan_id' })
  subscriptionPlanId: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'subscription_current_period_end',
  })
  subscriptionCurrentPeriodEnd: Date | null;

  @OneToMany(() => BusinessMember, (member) => member.business)
  members: BusinessMember[];

  @OneToMany(() => Service, (service) => service.business)
  services: Service[];

  @OneToMany(() => Employee, (employee) => employee.business)
  employees: Employee[];

  @OneToMany(() => Customer, (customer) => customer.business)
  customers: Customer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
