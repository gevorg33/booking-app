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
import type {
  ClinicPatientResultVisibility,
  ClinicResultMeasurementFlag,
  ClinicTestResultKind,
  ClinicTestResultStatus,
} from '../enums/clinic-lab.enums.js';
import { ClinicSpecimen } from './clinic-specimen.entity.js';
import { ClinicTestOrder } from './clinic-test-order.entity.js';
import { ClinicTestPanel } from './clinic-test-panel.entity.js';
import { ClinicTestResultMeasurement } from './clinic-test-result-measurement.entity.js';
import { ClinicTestResultStatusHistory } from './clinic-test-result-status-history.entity.js';
import { ClinicTestType } from './clinic-test-type.entity.js';

@Entity('clinic_test_results')
@Index(['businessId', 'status'])
@Index(['businessId', 'customerId'])
@Index(['businessId', 'bookingId'])
@Index(['orderId'])
export class ClinicTestResult {
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

  @ManyToOne(() => ClinicTestOrder, (order) => order.results, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'order_id' })
  order?: ClinicTestOrder | null;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId?: string | null;

  @ManyToOne(() => Booking, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking | null;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId?: string | null;

  @ManyToOne(() => ClinicSpecimen, (specimen) => specimen.results, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'specimen_id' })
  specimen?: ClinicSpecimen | null;

  @Column({ name: 'specimen_id', type: 'uuid', nullable: true })
  specimenId?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'NotReceived' })
  status: ClinicTestResultStatus;

  @Column({
    name: 'result_kind',
    type: 'varchar',
    length: 16,
    default: 'test_type',
  })
  resultKind: ClinicTestResultKind;

  @ManyToOne(() => ClinicTestType, (type) => type.results, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'test_type_id' })
  testType?: ClinicTestType | null;

  @Column({ name: 'test_type_id', type: 'uuid', nullable: true })
  testTypeId?: string | null;

  @ManyToOne(() => ClinicTestPanel, (panel) => panel.results, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'test_panel_id' })
  testPanel?: ClinicTestPanel | null;

  @Column({ name: 'test_panel_id', type: 'uuid', nullable: true })
  testPanelId?: string | null;

  @Column({
    name: 'measurement_flag',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  measurementFlag?: ClinicResultMeasurementFlag | null;

  @Column({
    name: 'patient_visibility',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  patientVisibility?: ClinicPatientResultVisibility | null;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  @Column({ name: 'review_comment', type: 'text', nullable: true })
  reviewComment?: string | null;

  @Column({ name: 'release_comment', type: 'text', nullable: true })
  releaseComment?: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'completed_by_employee_id' })
  completedByEmployee?: Employee | null;

  @Column({ name: 'completed_by_employee_id', type: 'uuid', nullable: true })
  completedByEmployeeId?: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date | null;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true })
  releasedAt?: Date | null;

  @OneToMany(() => ClinicTestResultMeasurement, (m) => m.result)
  measurements?: ClinicTestResultMeasurement[];

  @OneToMany(() => ClinicTestResultStatusHistory, (history) => history.result)
  statusHistory?: ClinicTestResultStatusHistory[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
