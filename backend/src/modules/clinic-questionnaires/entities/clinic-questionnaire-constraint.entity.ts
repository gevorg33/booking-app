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
import { ClinicQuestionnaire } from './clinic-questionnaire.entity.js';
import { ClinicQuestionnaireQuestion } from './clinic-questionnaire-question.entity.js';
import { ClinicQuestionnaireAnswerOption } from './clinic-questionnaire-answer-option.entity.js';

@Entity('clinic_questionnaire_constraints')
@Index(['questionnaireId', 'questionId'])
export class ClinicQuestionnaireConstraint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => ClinicQuestionnaire,
    (questionnaire) => questionnaire.constraints,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'questionnaire_id' })
  questionnaire: ClinicQuestionnaire;

  @Column({ name: 'questionnaire_id' })
  questionnaireId: string;

  @ManyToOne(
    () => ClinicQuestionnaireQuestion,
    (question) => question.constraints,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'question_id' })
  question: ClinicQuestionnaireQuestion;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => ClinicQuestionnaireQuestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'constraint_question_id' })
  constraintQuestion: ClinicQuestionnaireQuestion;

  @Column({ name: 'constraint_question_id' })
  constraintQuestionId: string;

  @ManyToOne(() => ClinicQuestionnaireAnswerOption, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'answer_option_id' })
  answerOption?: ClinicQuestionnaireAnswerOption | null;

  @Column({ name: 'answer_option_id', nullable: true })
  answerOptionId?: string | null;

  @Column({
    name: 'static_answer',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  staticAnswer?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
