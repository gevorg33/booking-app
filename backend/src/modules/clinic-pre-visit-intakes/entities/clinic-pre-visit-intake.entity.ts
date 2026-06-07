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
import { Booking } from '../../booking/entities/booking.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import { ClinicQuestionnaire } from '../../clinic-questionnaires/entities/clinic-questionnaire.entity.js';
import { ClinicQuestionnaireResponse } from '../../clinic-questionnaires/entities/clinic-questionnaire-response.entity.js';

export const CLINIC_PRE_VISIT_INTAKE_STATUSES = [
  'assigned',
  'in_progress',
  'completed',
] as const;

export type ClinicPreVisitIntakeStatus =
  (typeof CLINIC_PRE_VISIT_INTAKE_STATUSES)[number];

@Entity('clinic_pre_visit_intakes')
@Index(['businessId', 'customerId', 'status'])
@Index(['businessId', 'bookingId', 'status'])
export class ClinicPreVisitIntake {
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

  @ManyToOne(() => Booking, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking | null;

  @Column({ name: 'booking_id', nullable: true })
  bookingId?: string | null;

  @ManyToOne(() => ClinicQuestionnaire, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionnaire_id' })
  questionnaire: ClinicQuestionnaire;

  @Column({ name: 'questionnaire_id' })
  questionnaireId: string;

  @ManyToOne(() => ClinicQuestionnaireResponse, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'response_id' })
  response?: ClinicQuestionnaireResponse | null;

  @Column({ name: 'response_id', nullable: true })
  responseId?: string | null;

  @Column({ type: 'varchar', length: 16, default: 'assigned' })
  status: ClinicPreVisitIntakeStatus;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_by_employee_id' })
  assignedByEmployee?: Employee | null;

  @Column({ name: 'assigned_by_employee_id', nullable: true })
  assignedByEmployeeId?: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
