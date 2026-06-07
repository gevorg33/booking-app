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
import type {
  ClinicLabInfoType,
  ClinicLabLocation,
} from '../../../common/utils/clinic-lis.types.js';
import { Business } from '../../business/entities/business.entity.js';
import { ClinicLabMachine } from './clinic-lab-machine.entity.js';
import { ClinicLabSyncObservationRequest } from './clinic-lab-sync-observation-request.entity.js';

@Entity('clinic_lab_info')
@Index(['businessId', 'isActive', 'name'])
export class ClinicLabInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 512 })
  location: string;

  @Column({ type: 'varchar', length: 64 })
  phone: string;

  @Column({
    name: 'lab_location',
    type: 'varchar',
    length: 16,
    default: 'External',
  })
  labLocation: ClinicLabLocation;

  @Column({ name: 'lab_type', type: 'varchar', length: 16, nullable: true })
  labType?: ClinicLabInfoType | null;

  @Column({
    name: 'integration_vendor_code',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  integrationVendorCode?: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ClinicLabMachine, (machine) => machine.labInfo)
  machines?: ClinicLabMachine[];

  @OneToMany(
    () => ClinicLabSyncObservationRequest,
    (request) => request.labInfo,
  )
  syncObservationRequests?: ClinicLabSyncObservationRequest[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
