import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../../booking/entities/booking.entity.js';
import { Business } from '../../business/entities/business.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';

@Entity('clinic_after_visit_summaries')
@Unique(['businessId', 'bookingId'])
@Index(['businessId', 'customerId', 'createdAt'])
export class ClinicAfterVisitSummary {
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

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_employee_id' })
  author?: Employee | null;

  @Column({ name: 'author_employee_id', nullable: true })
  authorEmployeeId: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'released_to_patient', default: false })
  releasedToPatient: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
