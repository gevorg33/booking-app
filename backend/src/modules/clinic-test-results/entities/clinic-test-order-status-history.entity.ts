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
import type { ClinicTestOrderStatus } from '../enums/clinic-lab.enums.js';
import { ClinicTestOrder } from './clinic-test-order.entity.js';

@Entity('clinic_test_order_status_history')
@Index(['orderId', 'createdAt'])
export class ClinicTestOrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClinicTestOrder, (order) => order.statusHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: ClinicTestOrder;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ type: 'varchar', length: 32 })
  status: ClinicTestOrderStatus;

  @Column({
    name: 'previous_status',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  previousStatus?: ClinicTestOrderStatus | null;

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
