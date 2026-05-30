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
import { Employee } from '../../employee/entities/employee.entity.js';
import { Service } from '../../service/entities/service.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  REFUNDED = 'refunded',
  NOT_APPLICABLE = 'not_applicable',
}

@Entity('bookings')
@Index(['employeeId', 'startTime', 'endTime'])
@Index(['businessId', 'startTime'])
@Index(['businessId', 'status', 'paymentStatus'])
@Index(['businessId', 'paymentStatus', 'startTime'])
@Index(['slotId'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string;

  @ManyToOne(() => Employee, (employee) => employee.bookings)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => Customer, (customer) => customer.bookings, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id', nullable: true })
  customerId: string;

  @Column({ name: 'slot_id', nullable: true })
  slotId: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ type: 'simple-array', nullable: true })
  linkedEmployeeIds: string[];

  @Column({ nullable: true })
  virtualMeetingUrl: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  /** When true, appointment stays in DB but is omitted from schedule calendar views. */
  @Column({ name: 'hidden_from_calendar', default: false })
  hiddenFromCalendar: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
