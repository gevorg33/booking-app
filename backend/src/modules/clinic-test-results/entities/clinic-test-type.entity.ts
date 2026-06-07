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
import { Service } from '../../service/entities/service.entity.js';
import { ClinicDiagnosticCode } from '../../clinic-diagnostic-codes/entities/clinic-diagnostic-code.entity.js';
import { ClinicTestOrderItem } from './clinic-test-order-item.entity.js';
import { ClinicTestPanelItem } from './clinic-test-panel-item.entity.js';
import { ClinicTestResult } from './clinic-test-result.entity.js';
import { ClinicTestResultMeasurement } from './clinic-test-result-measurement.entity.js';

@Entity('clinic_test_types')
@Index(['businessId', 'isActive'])
@Index(['businessId', 'code'], { unique: true })
export class ClinicTestType {
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

  @Column({ type: 'varchar', length: 32, nullable: true })
  unit?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ name: 'requires_fasting', default: false })
  requiresFasting: boolean;

  @Column({ name: 'preparation_notes', type: 'text', nullable: true })
  preparationNotes?: string | null;

  @ManyToOne(() => Service, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_id' })
  service?: Service | null;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId?: string | null;

  @ManyToOne(() => ClinicDiagnosticCode, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'clinic_diagnostic_code_id' })
  clinicDiagnosticCode?: ClinicDiagnosticCode | null;

  @Column({ name: 'clinic_diagnostic_code_id', type: 'uuid', nullable: true })
  clinicDiagnosticCodeId?: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ClinicTestPanelItem, (item) => item.testType)
  panelItems?: ClinicTestPanelItem[];

  @OneToMany(() => ClinicTestOrderItem, (item) => item.testType)
  orderItems?: ClinicTestOrderItem[];

  @OneToMany(() => ClinicTestResult, (result) => result.testType)
  results?: ClinicTestResult[];

  @OneToMany(() => ClinicTestResultMeasurement, (m) => m.testType)
  measurements?: ClinicTestResultMeasurement[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
