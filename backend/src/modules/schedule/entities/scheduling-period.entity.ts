import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import { TemplatePeriodType } from './scheduling-template-period.entity.js';

/**
 * Applied scheduling period — one record per period per day.
 * Used for calendar display (whole-block view). Equivalent to
 * AppliedSchedulingTemplatePeriod in the clinic app.
 *
 * SchedulingSlot (10-min micro-slots) is kept separately for booking
 * counting/locking logic (same as clinic app).
 */
@Entity('scheduling_periods')
@Index(['employeeId', 'startTime', 'endTime'])
@Index(['businessId', 'startTime'])
export class SchedulingPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: TemplatePeriodType,
    default: TemplatePeriodType.SERVICE_BLOCK,
  })
  type: TemplatePeriodType;

  @Column({ nullable: true })
  placeholderLabel: string;

  /**
   * Services offered during this period.
   * NULL / empty = any service allowed (generic period).
   */
  @Column({ type: 'text', array: true, nullable: true, name: 'service_ids' })
  serviceIds: string[] | null;

  @Column({ type: 'int', default: 1 })
  maxAppointmentCount: number;

  /** Reference to the source template (null for direct schedules). */
  @Column({ type: 'varchar', nullable: true, name: 'template_id' })
  templateId: string | null;

  @Column({ name: 'block_schedule_id', type: 'uuid', nullable: true })
  blockScheduleId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
