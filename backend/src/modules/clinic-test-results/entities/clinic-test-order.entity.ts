import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../../booking/entities/booking.entity.js';
import { Business } from '../../business/entities/business.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import type { ClinicTestOrderStatus } from '../enums/clinic-lab.enums.js';
import { ClinicSpecimen } from './clinic-specimen.entity.js';
import { ClinicTestOrderItem } from './clinic-test-order-item.entity.js';
import { ClinicTestOrderStatusHistory } from './clinic-test-order-status-history.entity.js';
import { ClinicTestResult } from './clinic-test-result.entity.js';

@Entity('clinic_test_orders')
@Index(['businessId', 'status'])
@Index(['businessId', 'bookingId'])
@Index(['businessId', 'customerId'])
export class ClinicTestOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Booking, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking | null;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId?: string | null;

  /** Lab collection appointment once the patient books the pushed request. */
  @ManyToOne(() => Booking, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'collection_booking_id' })
  collectionBooking?: Booking | null;

  @Column({ name: 'collection_booking_id', type: 'uuid', nullable: true })
  collectionBookingId?: string | null;

  @Column({ name: 'collection_service_id', type: 'uuid', nullable: true })
  collectionServiceId?: string | null;

  @Column({
    name: 'booking_request_token',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  bookingRequestToken?: string | null;

  @Column({
    name: 'booking_request_pushed_at',
    type: 'timestamptz',
    nullable: true,
  })
  bookingRequestPushedAt?: Date | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'booking_request_pushed_by' })
  bookingRequestPushedBy?: Employee | null;

  @Column({ name: 'booking_request_pushed_by', type: 'uuid', nullable: true })
  bookingRequestPushedByEmployeeId?: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee | null;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'NotCollected' })
  status: ClinicTestOrderStatus;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  @Column({ name: 'custom_cancellation_reason', type: 'text', nullable: true })
  customCancellationReason?: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date | null;

  @Column({
    name: 'display_names',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  displayNames?: string | null;

  @OneToMany(() => ClinicTestOrderItem, (item) => item.order)
  items?: ClinicTestOrderItem[];

  @OneToMany(() => ClinicTestOrderStatusHistory, (history) => history.order)
  statusHistory?: ClinicTestOrderStatusHistory[];

  @OneToMany(() => ClinicSpecimen, (specimen) => specimen.order)
  specimens?: ClinicSpecimen[];

  @OneToMany(() => ClinicTestResult, (result) => result.order)
  results?: ClinicTestResult[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
