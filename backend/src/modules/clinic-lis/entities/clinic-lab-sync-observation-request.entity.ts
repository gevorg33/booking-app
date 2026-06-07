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
import type {
  ClinicLabSyncLinkMethod,
  ClinicLabSyncObservationStatus,
} from '../../../common/utils/clinic-lis.types.js';
import { Business } from '../../business/entities/business.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import { ClinicTestResult } from '../../clinic-test-results/entities/clinic-test-result.entity.js';
import { ClinicLabInfo } from './clinic-lab-info.entity.js';
import { ClinicLabSyncObservationResult } from './clinic-lab-sync-observation-result.entity.js';

@Entity('clinic_lab_sync_observation_requests')
@Index(['businessId', 'status', 'systemReceivedOn'])
export class ClinicLabSyncObservationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => ClinicLabInfo, (lab) => lab.syncObservationRequests, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'lab_info_id' })
  labInfo?: ClinicLabInfo | null;

  @Column({ name: 'lab_info_id', type: 'uuid', nullable: true })
  labInfoId?: string | null;

  @Column({ name: 'test_name', type: 'varchar', length: 255 })
  testName: string;

  @Column({ name: 'universal_code', type: 'varchar', length: 128 })
  universalCode: string;

  @Column({ name: 'patient_first_name', type: 'varchar', length: 128 })
  patientFirstName: string;

  @Column({
    name: 'patient_middle_name',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  patientMiddleName?: string | null;

  @Column({ name: 'patient_last_name', type: 'varchar', length: 128 })
  patientLastName: string;

  @Column({ name: 'patient_date_of_birth', type: 'date', nullable: true })
  patientDateOfBirth?: Date | null;

  @Column({
    name: 'patient_external_id',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  patientExternalId?: string | null;

  @Column({
    name: 'patient_address',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  patientAddress?: string | null;

  @Column({
    name: 'patient_postal_code',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  patientPostalCode?: string | null;

  @Column({
    name: 'patient_phone',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  patientPhone?: string | null;

  @Column({
    name: 'patient_sex_at_birth',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  patientSexAtBirth?: string | null;

  @Column({ name: 'system_received_on', type: 'timestamptz' })
  systemReceivedOn: Date;

  @Column({ name: 'specimen_received_on', type: 'timestamptz', nullable: true })
  specimenReceivedOn?: Date | null;

  @Column({ name: 'observation_date', type: 'timestamptz', nullable: true })
  observationDate?: Date | null;

  @Column({
    name: 'placer_order_number',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  placerOrderNumber?: string | null;

  @Column({
    name: 'ordering_provider',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  orderingProvider?: string | null;

  @Column({
    name: 'filler_order_number',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  fillerOrderNumber?: string | null;

  @Column({
    name: 'diagnostic_service_section_id',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  diagnosticServiceSectionId?: string | null;

  @Column({
    name: 'vendor_result_status',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  vendorResultStatus?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  department?: string | null;

  @Column({ name: 'revision_id', type: 'varchar', length: 128, nullable: true })
  revisionId?: string | null;

  @Column({
    name: 'integration_vendor_code',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  integrationVendorCode?: string | null;

  @Column({ type: 'varchar', length: 16, default: 'Unlinked' })
  status: ClinicLabSyncObservationStatus;

  @Column({ name: 'void_reason', type: 'text', nullable: true })
  voidReason?: string | null;

  @ManyToOne(() => ClinicTestResult, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clinic_test_result_id' })
  clinicTestResult?: ClinicTestResult | null;

  @Column({ name: 'clinic_test_result_id', type: 'uuid', nullable: true })
  clinicTestResultId?: string | null;

  @Column({ name: 'link_method', type: 'varchar', length: 16, nullable: true })
  linkMethod?: ClinicLabSyncLinkMethod | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'linked_by_employee_id' })
  linkedByEmployee?: Employee | null;

  @Column({ name: 'linked_by_employee_id', type: 'uuid', nullable: true })
  linkedByEmployeeId?: string | null;

  @Column({ name: 'linked_at', type: 'timestamptz', nullable: true })
  linkedAt?: Date | null;

  @OneToMany(
    () => ClinicLabSyncObservationResult,
    (result) => result.observationRequest,
  )
  observations?: ClinicLabSyncObservationResult[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
