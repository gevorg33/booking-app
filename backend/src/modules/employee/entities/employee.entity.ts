import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { User } from '../../user/entities/user.entity.js';
import { Booking } from '../../booking/entities/booking.entity.js';
import { ScheduleAssignment } from '../../schedule/entities/schedule-assignment.entity.js';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, (business) => business.employees, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'simple-array', nullable: true })
  serviceIds: string[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Booking, (booking) => booking.employee)
  bookings: Booking[];

  @OneToMany(() => ScheduleAssignment, (sa) => sa.employee)
  scheduleAssignments: ScheduleAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
