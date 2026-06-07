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
import { ClinicTestResultMeasurement } from '../../clinic-test-results/entities/clinic-test-result-measurement.entity.js';
import { ClinicLabSyncObservationRequest } from './clinic-lab-sync-observation-request.entity.js';

@Entity('clinic_lab_sync_observation_results')
@Index(['observationRequestId'])
export class ClinicLabSyncObservationResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => ClinicLabSyncObservationRequest,
    (request) => request.observations,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'observation_request_id' })
  observationRequest: ClinicLabSyncObservationRequest;

  @Column({ name: 'observation_request_id' })
  observationRequestId: string;

  @Column({ name: 'test_name', type: 'varchar', length: 255 })
  testName: string;

  @Column({ name: 'universal_code', type: 'varchar', length: 128 })
  universalCode: string;

  @Column({ name: 'result_value', type: 'text' })
  resultValue: string;

  @Column({ name: 'lab_comment', type: 'text', nullable: true })
  labComment?: string | null;

  @Column({
    name: 'vendor_result_status',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  vendorResultStatus?: string | null;

  @Column({ name: 'observation_date', type: 'timestamptz', nullable: true })
  observationDate?: Date | null;

  @Column({ name: 'producer_id', type: 'varchar', length: 128, nullable: true })
  producerId?: string | null;

  @Column({
    name: 'producer_text',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  producerText?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  unit?: string | null;

  @Column({
    name: 'reference_range',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  referenceRange?: string | null;

  @Column({
    name: 'abnormal_flags',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  abnormalFlags?: string | null;

  @Column({ name: 'revision_id', type: 'varchar', length: 128, nullable: true })
  revisionId?: string | null;

  @ManyToOne(() => ClinicTestResultMeasurement, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'clinic_test_result_measurement_id' })
  clinicTestResultMeasurement?: ClinicTestResultMeasurement | null;

  @Column({
    name: 'clinic_test_result_measurement_id',
    type: 'uuid',
    nullable: true,
  })
  clinicTestResultMeasurementId?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
