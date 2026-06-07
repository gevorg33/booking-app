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
import { PatientEncounter } from './patient-encounter.entity.js';

@Entity('patient_encounter_addenda')
@Index(['encounterId', 'createdAt'])
export class PatientEncounterAddendum {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PatientEncounter, (encounter) => encounter.addenda, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'encounter_id' })
  encounter: PatientEncounter;

  @Column({ name: 'encounter_id' })
  encounterId: string;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_employee_id' })
  author?: Employee | null;

  @Column({ name: 'author_employee_id', nullable: true })
  authorEmployeeId: string | null;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
