import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import { BlockScheduleInstance } from './block-schedule-instance.entity.js';

@Entity('block_schedules')
@Index(['businessId', 'employeeId'])
export class BlockSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({ type: 'varchar', nullable: true })
  placeholderLabel: string;

  @Column({ default: false })
  isRepetitive: boolean;

  /** YYYY-MM-DD — range start for repetitive blocks */
  @Column({ type: 'date', nullable: true })
  startDay: string | null;

  /** YYYY-MM-DD — range end for repetitive blocks */
  @Column({ type: 'date', nullable: true })
  endDay: string | null;

  /** HH:mm for repetitive daily window */
  @Column({ type: 'varchar', length: 5, nullable: true })
  blockStartTime: string | null;

  /** HH:mm for repetitive daily window */
  @Column({ type: 'varchar', length: 5, nullable: true })
  blockEndTime: string | null;

  @Column({ type: 'int', default: 1 })
  repeatWeeksCount: number;

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

  /** Full datetime window for one-off blocks */
  @Column({ type: 'timestamptz', nullable: true })
  singleStartTime: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  singleEndTime: Date | null;

  @Column({ default: false })
  isDeleted: boolean;

  @OneToMany(() => BlockScheduleInstance, (instance) => instance.blockSchedule)
  instances: BlockScheduleInstance[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
