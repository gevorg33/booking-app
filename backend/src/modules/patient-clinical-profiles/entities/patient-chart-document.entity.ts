import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { PatientDocumentCategory } from '../../../common/utils/patient-document-category.util.js';
import { Booking } from '../../booking/entities/booking.entity.js';
import { Business } from '../../business/entities/business.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';

@Entity('patient_chart_documents')
@Index(['businessId', 'customerId', 'createdAt'])
@Index(['businessId', 'customerId', 'category'])
export class PatientChartDocument {
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

  @Column({ type: 'varchar', length: 32 })
  category: PatientDocumentCategory;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ name: 'original_file_name', type: 'varchar', length: 255 })
  originalFileName: string;

  @Column({
    name: 'mime_type',
    type: 'varchar',
    length: 128,
    default: 'application/pdf',
  })
  mimeType: string;

  @Column({ name: 'file_size_bytes', type: 'int' })
  fileSizeBytes: number;

  @Column({ name: 'storage_public_id', type: 'varchar', length: 512 })
  storagePublicId: string;

  @Column({ name: 'storage_url', type: 'text' })
  storageUrl: string;

  @ManyToOne(() => Booking, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking | null;

  @Column({ name: 'booking_id', nullable: true })
  bookingId: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploaded_by_employee_id' })
  uploadedBy?: Employee | null;

  @Column({ name: 'uploaded_by_employee_id', nullable: true })
  uploadedByEmployeeId: string | null;

  @Column({ name: 'released_to_patient', default: false })
  releasedToPatient: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
