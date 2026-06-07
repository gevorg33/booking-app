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
import { ClinicSpecimen } from '../../clinic-test-results/entities/clinic-specimen.entity.js';
import { ClinicTestOrder } from '../../clinic-test-results/entities/clinic-test-order.entity.js';
import { ClinicTestResult } from '../../clinic-test-results/entities/clinic-test-result.entity.js';
import { PatientEncounter } from '../../patient-clinical-profiles/entities/patient-encounter.entity.js';
import type {
  ClinicTaskPriority,
  ClinicTaskStatus,
  ClinicTaskType,
} from '../../../common/utils/clinic-task.types.js';

@Entity('clinic_tasks')
@Index(['businessId', 'status', 'dueAt'])
@Index(['businessId', 'assigneeEmployeeId', 'status'])
@Index(['businessId', 'taskType', 'status'])
@Index(['businessId', 'customerId', 'status'])
export class ClinicTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'task_type', type: 'varchar', length: 32 })
  taskType: ClinicTaskType;

  @Column({ type: 'varchar', length: 16, default: 'open' })
  status: ClinicTaskStatus;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'varchar', length: 16, default: 'normal' })
  priority: ClinicTaskPriority;

  @Column({ name: 'due_at', type: 'timestamptz', nullable: true })
  dueAt?: Date | null;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @Column({ name: 'customer_id', nullable: true })
  customerId?: string | null;

  @ManyToOne(() => Booking, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking | null;

  @Column({ name: 'booking_id', nullable: true })
  bookingId?: string | null;

  @ManyToOne(() => ClinicTestOrder, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'test_order_id' })
  testOrder?: ClinicTestOrder | null;

  @Column({ name: 'test_order_id', nullable: true })
  testOrderId?: string | null;

  @ManyToOne(() => ClinicTestResult, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'test_result_id' })
  testResult?: ClinicTestResult | null;

  @Column({ name: 'test_result_id', nullable: true })
  testResultId?: string | null;

  @ManyToOne(() => ClinicSpecimen, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'specimen_id' })
  specimen?: ClinicSpecimen | null;

  @Column({ name: 'specimen_id', nullable: true })
  specimenId?: string | null;

  @ManyToOne(() => PatientEncounter, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'encounter_id' })
  encounter?: PatientEncounter | null;

  @Column({ name: 'encounter_id', nullable: true })
  encounterId?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignee_employee_id' })
  assigneeEmployee?: Employee | null;

  @Column({ name: 'assignee_employee_id', nullable: true })
  assigneeEmployeeId?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_employee_id' })
  createdByEmployee?: Employee | null;

  @Column({ name: 'created_by_employee_id', nullable: true })
  createdByEmployeeId?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'completed_by_employee_id' })
  completedByEmployee?: Employee | null;

  @Column({ name: 'completed_by_employee_id', nullable: true })
  completedByEmployeeId?: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date | null;

  @Column({ name: 'is_auto_managed', default: false })
  isAutoManaged: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
