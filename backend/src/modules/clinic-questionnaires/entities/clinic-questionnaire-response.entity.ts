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
import { Business } from '../../business/entities/business.entity.js';
import { Booking } from '../../booking/entities/booking.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { ClinicQuestionnaire } from './clinic-questionnaire.entity.js';
import { ClinicQuestionnaireQuestion } from './clinic-questionnaire-question.entity.js';
import type { ClinicQuestionnaireAnswerMap } from '../../../common/utils/clinic-questionnaire.types.js';

@Entity('clinic_questionnaire_responses')
@Index(['businessId', 'customerId', 'status'])
export class ClinicQuestionnaireResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(
    () => ClinicQuestionnaire,
    (questionnaire) => questionnaire.responses,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'questionnaire_id' })
  questionnaire: ClinicQuestionnaire;

  @Column({ name: 'questionnaire_id' })
  questionnaireId: string;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @Column({ name: 'customer_id', nullable: true })
  customerId?: string | null;

  @ManyToOne(() => Booking, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking | null;

  @Column({ name: 'booking_id', nullable: true })
  bookingId?: string | null;

  @Column({ type: 'varchar', length: 16, default: 'in_progress' })
  status: string;

  @ManyToOne(() => ClinicQuestionnaireQuestion, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'current_question_id' })
  currentQuestion?: ClinicQuestionnaireQuestion | null;

  @Column({ name: 'current_question_id', nullable: true })
  currentQuestionId?: string | null;

  @Column({ type: 'jsonb', default: {} })
  answers: ClinicQuestionnaireAnswerMap;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
