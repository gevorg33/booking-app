import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('consumer_native_push_tokens')
@Index(['customerId', 'businessId', 'platform'], { unique: true })
export class ConsumerNativePushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ type: 'varchar', length: 512 })
  token: string;

  @Column({ type: 'varchar', length: 16 })
  platform: 'ios' | 'android';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
