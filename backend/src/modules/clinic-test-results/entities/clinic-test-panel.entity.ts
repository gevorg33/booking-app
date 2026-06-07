import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { ClinicTestOrderItem } from './clinic-test-order-item.entity.js';
import { ClinicTestPanelItem } from './clinic-test-panel-item.entity.js';
import { ClinicTestResult } from './clinic-test-result.entity.js';

@Entity('clinic_test_panels')
@Index(['businessId', 'isActive'])
@Index(['businessId', 'code'], { unique: true })
export class ClinicTestPanel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ length: 64 })
  code: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  abbreviation?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ClinicTestPanelItem, (item) => item.panel)
  items?: ClinicTestPanelItem[];

  @OneToMany(() => ClinicTestOrderItem, (item) => item.testPanel)
  orderItems?: ClinicTestOrderItem[];

  @OneToMany(() => ClinicTestResult, (result) => result.testPanel)
  results?: ClinicTestResult[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
