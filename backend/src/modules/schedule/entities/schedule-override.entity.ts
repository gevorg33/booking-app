import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Employee } from '../../employee/entities/employee.entity.js';
import { Business } from '../../business/entities/business.entity.js';
import { TimeSlotRange } from './schedule-template.entity.js';

export enum OverrideType {
  VACATION = 'vacation',
  SICK_LEAVE = 'sick_leave',
  CUSTOM_HOURS = 'custom_hours',
  BLOCKED = 'blocked',
}

@Entity('schedule_overrides')
export class ScheduleOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'enum', enum: OverrideType })
  type: OverrideType;

  @Column({ type: 'jsonb', nullable: true })
  customHours: TimeSlotRange[];

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
