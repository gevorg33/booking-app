import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('event_store')
@Index(['eventType', 'createdAt'])
@Index(['aggregateType', 'aggregateId'])
export class OperationalEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventType: string;

  @Column()
  aggregateType: string;

  @Column()
  aggregateId: string;

  @Column({ nullable: true })
  businessId: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  causationId: string;

  @Column({ nullable: true })
  correlationId: string;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
