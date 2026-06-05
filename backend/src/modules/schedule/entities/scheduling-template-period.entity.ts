import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ScheduleTemplate } from './schedule-template.entity.js';

export enum TemplatePeriodType {
  SERVICE_BLOCK = 'service_block',
  UNAVAILABLE_BLOCK = 'unavailable_block',
  BLOCKED_TIME = 'blocked_time',
}

@Entity('scheduling_template_periods')
export class SchedulingTemplatePeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ScheduleTemplate, (t) => t.periods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: ScheduleTemplate;

  @Column({ name: 'template_id' })
  templateId: string;

  @Column({
    type: 'enum',
    enum: TemplatePeriodType,
    default: TemplatePeriodType.SERVICE_BLOCK,
  })
  type: TemplatePeriodType;

  @Column()
  startTime: string; // HH:mm 24-hour

  @Column()
  endTime: string; // HH:mm 24-hour

  @Column({ nullable: true })
  placeholderLabel: string;

  @Column({ default: false })
  isActiveOnMonday: boolean;

  @Column({ default: false })
  isActiveOnTuesday: boolean;

  @Column({ default: false })
  isActiveOnWednesday: boolean;

  @Column({ default: false })
  isActiveOnThursday: boolean;

  @Column({ default: false })
  isActiveOnFriday: boolean;

  @Column({ default: false })
  isActiveOnSaturday: boolean;

  @Column({ default: false })
  isActiveOnSunday: boolean;

  @Column({ type: 'simple-array', nullable: true })
  serviceIds: string[];

  @Column({ type: 'int', default: 1 })
  maxAppointmentCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
