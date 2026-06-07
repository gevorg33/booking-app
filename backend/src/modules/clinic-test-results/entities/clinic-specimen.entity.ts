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
import { Booking } from '../../booking/entities/booking.entity.js';
import { Business } from '../../business/entities/business.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import type { ClinicSpecimenStatus } from '../enums/clinic-lab.enums.js';
import { ClinicSpecimenStorageLocation } from './clinic-specimen-storage-location.entity.js';
import { ClinicTransportFolder } from './clinic-transport-folder.entity.js';
import { ClinicTestOrder } from './clinic-test-order.entity.js';
import { ClinicTestResult } from './clinic-test-result.entity.js';
import { ClinicSpecimenStatusHistory } from './clinic-specimen-status-history.entity.js';

@Entity('clinic_specimens')
@Index(['businessId', 'status'])
@Index(['orderId'])
export class ClinicSpecimen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => ClinicTestOrder, (order) => order.specimens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: ClinicTestOrder;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Booking, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking | null;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId?: string | null;

  @Column({
    name: 'specimen_identifier',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  specimenIdentifier?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'NotCollected' })
  status: ClinicSpecimenStatus;

  @Column({ name: 'collected_at', type: 'timestamptz', nullable: true })
  collectedAt?: Date | null;

  @Column({ name: 'received_in_lab_at', type: 'timestamptz', nullable: true })
  receivedInLabAt?: Date | null;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt?: Date | null;

  @Column({ name: 'incompletion_reason', type: 'text', nullable: true })
  incompletionReason?: string | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'collected_by_employee_id' })
  collectedByEmployee?: Employee | null;

  @Column({ name: 'collected_by_employee_id', type: 'uuid', nullable: true })
  collectedByEmployeeId?: string | null;

  @ManyToOne(() => ClinicSpecimenStorageLocation, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'storage_location_id' })
  storageLocation?: ClinicSpecimenStorageLocation | null;

  @Column({ name: 'storage_location_id', type: 'uuid', nullable: true })
  storageLocationId?: string | null;

  @Column({ name: 'stored_at', type: 'timestamptz', nullable: true })
  storedAt?: Date | null;

  @ManyToOne(() => ClinicTransportFolder, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'transport_folder_id' })
  transportFolder?: ClinicTransportFolder | null;

  @Column({ name: 'transport_folder_id', type: 'uuid', nullable: true })
  transportFolderId?: string | null;

  @Column({ name: 'lab_machine_id', type: 'uuid', nullable: true })
  labMachineId?: string | null;

  @OneToMany(() => ClinicTestResult, (result) => result.specimen)
  results?: ClinicTestResult[];

  @OneToMany(() => ClinicSpecimenStatusHistory, (history) => history.specimen)
  statusHistory?: ClinicSpecimenStatusHistory[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
