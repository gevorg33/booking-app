import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Employee } from '../../employee/entities/employee.entity.js';
import type { ClinicTestResultStatus } from '../enums/clinic-lab.enums.js';
import { ClinicTestResult } from './clinic-test-result.entity.js';

@Entity('clinic_test_result_status_history')
@Index(['resultId', 'createdAt'])
export class ClinicTestResultStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClinicTestResult, (result) => result.statusHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'result_id' })
  result: ClinicTestResult;

  @Column({ name: 'result_id' })
  resultId: string;

  @Column({ type: 'varchar', length: 32 })
  status: ClinicTestResultStatus;

  @Column({
    name: 'previous_status',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  previousStatus?: ClinicTestResultStatus | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee | null;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId?: string | null;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
