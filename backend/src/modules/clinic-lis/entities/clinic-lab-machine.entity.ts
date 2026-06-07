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
import { ClinicLabInfo } from './clinic-lab-info.entity.js';

@Entity('clinic_lab_machines')
@Index(['businessId', 'isActive', 'name'])
export class ClinicLabMachine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => ClinicLabInfo, (lab) => lab.machines, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'lab_info_id' })
  labInfo?: ClinicLabInfo | null;

  @Column({ name: 'lab_info_id', type: 'uuid', nullable: true })
  labInfoId?: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
