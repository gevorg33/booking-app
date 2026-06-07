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
import type { ClinicSpecimenStatus } from '../enums/clinic-lab.enums.js';
import { ClinicSpecimen } from './clinic-specimen.entity.js';

@Entity('clinic_specimen_status_history')
@Index(['specimenId', 'createdAt'])
export class ClinicSpecimenStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClinicSpecimen, (specimen) => specimen.statusHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'specimen_id' })
  specimen: ClinicSpecimen;

  @Column({ name: 'specimen_id' })
  specimenId: string;

  @Column({ type: 'varchar', length: 32 })
  status: ClinicSpecimenStatus;

  @Column({
    name: 'previous_status',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  previousStatus?: ClinicSpecimenStatus | null;

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
