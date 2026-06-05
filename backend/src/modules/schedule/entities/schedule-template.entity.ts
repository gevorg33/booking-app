import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { ScheduleAssignment } from './schedule-assignment.entity.js';
import { SchedulingTemplatePeriod } from './scheduling-template-period.entity.js';

export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6,
}

export interface TimeSlotRange {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface BreakSlot {
  startTime: string;
  endTime: string;
  label?: string;
}

@Entity('schedule_templates')
export class ScheduleTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ length: 50, nullable: true })
  name: string;

  @Column({ type: 'int', nullable: true })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'jsonb', nullable: true })
  workingHours: TimeSlotRange[];

  @Column({ type: 'jsonb', default: [] })
  breaks: BreakSlot[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'int', default: 0 })
  countDaysComplete: number;

  @Column({ type: 'int', default: 0 })
  countDaysIncomplete: number;

  @OneToMany(() => ScheduleAssignment, (sa) => sa.template)
  assignments: ScheduleAssignment[];

  @OneToMany(() => SchedulingTemplatePeriod, (p) => p.template, {
    cascade: true,
  })
  periods: SchedulingTemplatePeriod[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
