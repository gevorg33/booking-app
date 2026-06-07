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
import { Business } from '../../business/entities/business.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';

@Entity('patient_clinical_profiles')
@Unique(['businessId', 'customerId'])
@Index(['businessId', 'customerId'])
export class PatientClinicalProfile {
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

  @Column({ type: 'text', nullable: true })
  allergies?: string | null;

  @Column({ name: 'chronic_problems', type: 'text', nullable: true })
  chronicProblems?: string | null;

  @Column({ name: 'emergency_contact_name', type: 'text', nullable: true })
  emergencyContactName?: string | null;

  @Column({ name: 'emergency_contact_phone', type: 'text', nullable: true })
  emergencyContactPhone?: string | null;

  @Column({
    name: 'emergency_contact_relationship',
    type: 'text',
    nullable: true,
  })
  emergencyContactRelationship?: string | null;

  @Column({ name: 'blood_type', type: 'varchar', length: 16, nullable: true })
  bloodType?: string | null;

  @Column({
    name: 'referring_external_doctor_id',
    type: 'uuid',
    nullable: true,
  })
  referringExternalDoctorId?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
