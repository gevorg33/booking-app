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
import type { ClinicResultMeasurementFlag } from '../enums/clinic-lab.enums.js';
import { ClinicTestResult } from './clinic-test-result.entity.js';
import { ClinicTestType } from './clinic-test-type.entity.js';

@Entity('clinic_test_result_measurements')
@Index(['resultId'])
export class ClinicTestResultMeasurement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClinicTestResult, (result) => result.measurements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'result_id' })
  result: ClinicTestResult;

  @Column({ name: 'result_id' })
  resultId: string;

  @ManyToOne(() => ClinicTestType, (type) => type.measurements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'test_type_id' })
  testType: ClinicTestType;

  @Column({ name: 'test_type_id' })
  testTypeId: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  value?: string | null;

  @Column({
    name: 'measurement_flag',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  measurementFlag?: ClinicResultMeasurementFlag | null;

  @Column({ name: 'lab_comment', type: 'text', nullable: true })
  labComment?: string | null;

  @Column({ name: 'received_at', type: 'timestamptz', nullable: true })
  receivedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
