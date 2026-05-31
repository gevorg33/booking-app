import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';

export type MultiServiceSchedulingMode = 'same_visit' | 'per_service';

@Entity('multi_service_booking_groups')
@Index(['businessId'])
@Index(['customerId'])
export class MultiServiceBookingGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ name: 'scheduling_mode', type: 'varchar', length: 32, default: 'same_visit' })
  schedulingMode: MultiServiceSchedulingMode;

  @Column({ name: 'total_duration_minutes', type: 'int', default: 0 })
  totalDurationMinutes: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ length: 8, default: 'USD' })
  currency: string;

  @Column({ name: 'block_start_time', type: 'timestamptz', nullable: true })
  blockStartTime: Date | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'primary_employee_id' })
  primaryEmployee: Employee | null;

  @Column({ name: 'primary_employee_id', type: 'uuid', nullable: true })
  primaryEmployeeId: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
