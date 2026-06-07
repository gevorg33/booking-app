import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import type {
  ClinicDiagnosticCodeKind,
  ClinicDiagnosticCodeSystem,
} from '../../../common/utils/clinic-diagnostic-code.types.js';

@Entity('clinic_diagnostic_codes')
@Index(['businessId', 'isActive'])
@Index(['businessId', 'codeKind', 'isActive'])
@Index(['businessId', 'codeKind', 'codeSystem', 'code'], { unique: true })
export class ClinicDiagnosticCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'code_kind', type: 'varchar', length: 16 })
  codeKind: ClinicDiagnosticCodeKind;

  @Column({ name: 'code_system', type: 'varchar', length: 32 })
  codeSystem: ClinicDiagnosticCodeSystem;

  @Column({ type: 'varchar', length: 64 })
  code: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'search_description', type: 'text', nullable: true })
  searchDescription?: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_employee_id' })
  createdByEmployee?: Employee | null;

  @Column({ name: 'created_by_employee_id', nullable: true })
  createdByEmployeeId?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by_employee_id' })
  updatedByEmployee?: Employee | null;

  @Column({ name: 'updated_by_employee_id', nullable: true })
  updatedByEmployeeId?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
