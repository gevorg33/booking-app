import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import type { ClinicPatientAlertType } from '../../../common/utils/clinic-patient-alert.types.js';

@Entity('clinic_patient_alert_dismissals')
@Index(['businessId', 'customerId'])
@Index(['businessId', 'customerId', 'alertType', 'sourceId'], { unique: true })
export class ClinicPatientAlertDismissal {
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

  @Column({ name: 'alert_type', type: 'varchar', length: 32 })
  alertType: ClinicPatientAlertType;

  @Column({ name: 'source_id' })
  sourceId: string;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'dismissed_by_employee_id' })
  dismissedByEmployee?: Employee | null;

  @Column({ name: 'dismissed_by_employee_id', nullable: true })
  dismissedByEmployeeId?: string | null;

  @Column({ name: 'dismissed_at', type: 'timestamptz' })
  dismissedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
