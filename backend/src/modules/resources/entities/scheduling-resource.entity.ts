import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';

export enum SchedulingResourceType {
  ROOM = 'room',
  CHAIR = 'chair',
  EQUIPMENT = 'equipment',
}

@Entity('scheduling_resources')
export class SchedulingResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @Column()
  name: string;

  @Column({ name: 'resource_type', default: SchedulingResourceType.ROOM })
  resourceType: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('service_resource_requirements')
export class ServiceResourceRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ name: 'service_id' })
  serviceId: string;

  @Column({ name: 'resource_id' })
  resourceId: string;

  @ManyToOne(() => SchedulingResource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resource_id' })
  resource: SchedulingResource;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('booking_resources')
export class BookingResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @Column({ name: 'resource_id' })
  resourceId: string;

  @ManyToOne(() => SchedulingResource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resource_id' })
  resource: SchedulingResource;

  @CreateDateColumn()
  createdAt: Date;
}
