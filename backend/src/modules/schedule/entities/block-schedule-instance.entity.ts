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
import { BlockSchedule } from './block-schedule.entity.js';

@Entity('block_schedule_instances')
@Index(['employeeId', 'startTime', 'endTime'])
@Index(['blockScheduleId'])
export class BlockScheduleInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BlockSchedule, (schedule) => schedule.instances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'block_schedule_id' })
  blockSchedule: BlockSchedule;

  @Column({ name: 'block_schedule_id', type: 'uuid' })
  blockScheduleId: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
