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
import { ClinicQuestionnaireQuestion } from './clinic-questionnaire-question.entity.js';

@Entity('clinic_questionnaire_answer_options')
@Index(['questionId', 'sequence'])
export class ClinicQuestionnaireAnswerOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => ClinicQuestionnaireQuestion,
    (question) => question.answerOptions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'question_id' })
  question: ClinicQuestionnaireQuestion;

  @Column({ name: 'question_id' })
  questionId: string;

  @Column({ type: 'text' })
  display: string;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  @Column({ type: 'int', default: 0 })
  sequence: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
