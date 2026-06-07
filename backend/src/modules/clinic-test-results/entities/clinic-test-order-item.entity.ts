import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { ClinicTestOrderItemType } from '../enums/clinic-lab.enums.js';
import { ClinicTestOrder } from './clinic-test-order.entity.js';
import { ClinicTestPanel } from './clinic-test-panel.entity.js';
import { ClinicTestType } from './clinic-test-type.entity.js';

@Entity('clinic_test_order_items')
@Index(['orderId'])
export class ClinicTestOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClinicTestOrder, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: ClinicTestOrder;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ type: 'varchar', length: 16 })
  type: ClinicTestOrderItemType;

  @ManyToOne(() => ClinicTestType, (type) => type.orderItems, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'test_type_id' })
  testType?: ClinicTestType | null;

  @Column({ name: 'test_type_id', type: 'uuid', nullable: true })
  testTypeId?: string | null;

  @ManyToOne(() => ClinicTestPanel, (panel) => panel.orderItems, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'test_panel_id' })
  testPanel?: ClinicTestPanel | null;

  @Column({ name: 'test_panel_id', type: 'uuid', nullable: true })
  testPanelId?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
