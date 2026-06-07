import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from '../../booking/entities/booking.entity.js';
import { Business } from '../../business/entities/business.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';

@Entity('patient_staff_notes')
@Index(['businessId', 'customerId', 'createdAt'])
export class PatientStaffNote {
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

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_employee_id' })
  author?: Employee | null;

  @Column({ name: 'author_employee_id', nullable: true })
  authorEmployeeId: string | null;

  @ManyToOne(() => Booking, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking | null;

  @Column({ name: 'booking_id', nullable: true })
  bookingId: string | null;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
