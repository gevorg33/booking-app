import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { ClinicQuestionnaireQuestion } from './clinic-questionnaire-question.entity.js';
import { ClinicQuestionnaireConstraint } from './clinic-questionnaire-constraint.entity.js';
import { ClinicQuestionnaireResponse } from './clinic-questionnaire-response.entity.js';

@Entity('clinic_questionnaires')
@Index(['businessId', 'code'], { unique: true })
export class ClinicQuestionnaire {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'business_id' })
  businessId: string;

  @Column({ type: 'varchar', length: 64 })
  code: string;

  @Column({ name: 'internal_name', type: 'varchar', length: 128 })
  internalName: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'intro_title', type: 'varchar', length: 255, nullable: true })
  introTitle?: string | null;

  @Column({ name: 'intro_body', type: 'text', nullable: true })
  introBody?: string | null;

  @Column({ type: 'int', default: 1 })
  revision: number;

  @Column({ type: 'varchar', length: 16, default: 'draft' })
  status: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date | null;

  @OneToMany(
    () => ClinicQuestionnaireQuestion,
    (question) => question.questionnaire,
  )
  questions?: ClinicQuestionnaireQuestion[];

  @OneToMany(
    () => ClinicQuestionnaireConstraint,
    (constraint) => constraint.questionnaire,
  )
  constraints?: ClinicQuestionnaireConstraint[];

  @OneToMany(
    () => ClinicQuestionnaireResponse,
    (response) => response.questionnaire,
  )
  responses?: ClinicQuestionnaireResponse[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
