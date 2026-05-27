import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { MemberRole } from '../../business/entities/business-member.entity.js';

@Entity('business_invitations')
export class BusinessInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.CONTRIBUTOR })
  role: MemberRole;

  @Column()
  token: string;

  @Column({ nullable: true })
  employeeName: string;

  @Column({ name: 'created_by_user_id', nullable: true })
  createdByUserId: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
