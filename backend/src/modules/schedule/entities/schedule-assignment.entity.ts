import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Employee } from '../../employee/entities/employee.entity.js';
import { ScheduleTemplate } from './schedule-template.entity.js';

@Entity('schedule_assignments')
export class ScheduleAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, (employee) => employee.scheduleAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => ScheduleTemplate, (template) => template.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_id' })
  template: ScheduleTemplate;

  @Column({ name: 'template_id' })
  templateId: string;

  @Column({ type: 'date' })
  effectiveFrom: Date;

  @Column({ type: 'date', nullable: true })
  effectiveTo: Date;

  @CreateDateColumn()
  createdAt: Date;
}
