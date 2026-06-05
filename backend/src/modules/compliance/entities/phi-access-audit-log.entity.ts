import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type PhiAccessAction = 'read' | 'write';

@Entity('phi_access_audit_logs')
@Index(['businessId', 'createdAt'])
@Index(['resourceType', 'resourceId'])
export class PhiAccessAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 32 })
  role: string;

  @Column({ type: 'varchar', length: 8 })
  action: PhiAccessAction;

  @Column({ name: 'resource_type', type: 'varchar', length: 64 })
  resourceType: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 64 })
  resourceId: string;

  @Column({ name: 'field_name', type: 'varchar', length: 64, nullable: true })
  fieldName: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
