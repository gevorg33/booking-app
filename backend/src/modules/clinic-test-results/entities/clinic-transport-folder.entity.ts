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
import { Employee } from '../../employee/entities/employee.entity.js';
import type { ClinicTransportFolderStatus } from '../enums/clinic-lab.enums.js';
import { ClinicSpecimen } from './clinic-specimen.entity.js';
import { ClinicSpecimenStorageLocation } from './clinic-specimen-storage-location.entity.js';

@Entity('clinic_transport_folders')
@Index(['businessId', 'status'])
export class ClinicTransportFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'folder_code', type: 'varchar', length: 64 })
  folderCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'Open' })
  status: ClinicTransportFolderStatus;

  @ManyToOne(() => ClinicSpecimenStorageLocation, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'origin_storage_location_id' })
  originStorageLocation?: ClinicSpecimenStorageLocation | null;

  @Column({ name: 'origin_storage_location_id', type: 'uuid', nullable: true })
  originStorageLocationId?: string | null;

  @ManyToOne(() => ClinicSpecimenStorageLocation, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'destination_storage_location_id' })
  destinationStorageLocation?: ClinicSpecimenStorageLocation | null;

  @Column({
    name: 'destination_storage_location_id',
    type: 'uuid',
    nullable: true,
  })
  destinationStorageLocationId?: string | null;

  @Column({ name: 'shipped_at', type: 'timestamptz', nullable: true })
  shippedAt?: Date | null;

  @Column({ name: 'received_at', type: 'timestamptz', nullable: true })
  receivedAt?: Date | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_employee_id' })
  createdByEmployee?: Employee | null;

  @Column({ name: 'created_by_employee_id', type: 'uuid', nullable: true })
  createdByEmployeeId?: string | null;

  @OneToMany(() => ClinicSpecimen, (specimen) => specimen.transportFolder)
  specimens?: ClinicSpecimen[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
