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
import { Service } from '../../service/entities/service.entity.js';

export enum SlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
  UNAVAILABLE = 'unavailable',
}

@Entity('scheduling_slots')
@Index(['employeeId', 'startTime', 'endTime'])
@Index(['businessId', 'startTime', 'status'])
export class SchedulingSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'enum', enum: SlotStatus, default: SlotStatus.AVAILABLE })
  status: SlotStatus;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id', nullable: true })
  employeeId: string;

  @ManyToOne(() => Service, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  /** Legacy single-service reference (kept for FK relation). Use serviceIds for all logic. */
  @Column({ name: 'service_id', nullable: true })
  serviceId: string;

  /**
   * All services this slot can be booked for.
   * NULL / empty array = any service is permitted (generic slot).
   * One or more entries = strict: booking serviceId must be in this list.
   */
  @Column({ type: 'text', array: true, nullable: true, name: 'service_ids' })
  serviceIds: string[] | null;

  @Column({ type: 'int', default: 0 })
  appointmentCount: number;

  @Column({ type: 'int', default: 1 })
  maxAppointmentCount: number;

  @Column({ nullable: true })
  placeholderLabel: string;

  @Column({ nullable: true })
  templateId: string;

  /** Set when this micro-slot was blocked by a block schedule. */
  @Column({ name: 'block_schedule_id', type: 'uuid', nullable: true })
  blockScheduleId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
