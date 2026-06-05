import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Business } from './business.entity.js';
import { User } from '../../user/entities/user.entity.js';

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  CONTRIBUTOR = 'contributor',
}

@Entity('business_members')
export class BusinessMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.businessMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Business, (business) => business.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.STAFF })
  role: MemberRole;

  @CreateDateColumn()
  createdAt: Date;
}
