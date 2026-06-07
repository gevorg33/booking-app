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
import type {
  ClinicLabSyncInboundSource,
  ClinicLabSyncInboundStatus,
} from '../../../common/utils/clinic-lis.types.js';
import { Business } from '../../business/entities/business.entity.js';
import { ClinicLabInfo } from './clinic-lab-info.entity.js';
import { ClinicLabSyncObservationRequest } from './clinic-lab-sync-observation-request.entity.js';

@Entity('clinic_lab_sync_inbound_messages')
@Index(['status', 'receivedAt'])
export class ClinicLabSyncInboundMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ type: 'varchar', length: 16 })
  source: ClinicLabSyncInboundSource;

  @Column({ name: 'content_type', type: 'varchar', length: 128 })
  contentType: string;

  @Column({
    name: 'integration_vendor_code',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  integrationVendorCode?: string | null;

  @ManyToOne(() => ClinicLabInfo, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lab_info_id' })
  labInfo?: ClinicLabInfo | null;

  @Column({ name: 'lab_info_id', type: 'uuid', nullable: true })
  labInfoId?: string | null;

  @Column({
    name: 'idempotency_key',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  idempotencyKey?: string | null;

  @Column({ name: 'raw_payload', type: 'text' })
  rawPayload: string;

  @Column({ type: 'varchar', length: 16, default: 'Pending' })
  status: ClinicLabSyncInboundStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @ManyToOne(() => ClinicLabSyncObservationRequest, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'observation_request_id' })
  observationRequest?: ClinicLabSyncObservationRequest | null;

  @Column({ name: 'observation_request_id', type: 'uuid', nullable: true })
  observationRequestId?: string | null;

  @Column({ name: 'received_at', type: 'timestamptz' })
  receivedAt: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
