import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('native_push_tokens')
@Index(['userId', 'businessId', 'platform'])
export class NativePushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ type: 'varchar', length: 512 })
  token: string;

  @Column({ type: 'varchar', length: 16 })
  platform: 'ios' | 'android';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
