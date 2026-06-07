import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';

@Entity('external_doctors')
@Index(['businessId', 'isActive'])
export class ExternalDoctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'clinic_name', type: 'varchar', length: 255, nullable: true })
  clinicName?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  specialty?: string | null;

  @Column({ type: 'varchar', length: 255 })
  street: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  unit?: string | null;

  @Column({ type: 'varchar', length: 128 })
  city: string;

  @Column({ type: 'varchar', length: 128 })
  province: string;

  @Column({ type: 'varchar', length: 128 })
  country: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 32 })
  postalCode: string;

  @Column({ name: 'fax_number', type: 'varchar', length: 64, nullable: true })
  faxNumber?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_employee_id' })
  createdByEmployee?: Employee | null;

  @Column({ name: 'created_by_employee_id', nullable: true })
  createdByEmployeeId?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by_employee_id' })
  updatedByEmployee?: Employee | null;

  @Column({ name: 'updated_by_employee_id', nullable: true })
  updatedByEmployeeId?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
