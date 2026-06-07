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
import { ClinicQuestionnaire } from './clinic-questionnaire.entity.js';
import { ClinicQuestionnaireAnswerOption } from './clinic-questionnaire-answer-option.entity.js';
import { ClinicQuestionnaireConstraint } from './clinic-questionnaire-constraint.entity.js';

@Entity('clinic_questionnaire_questions')
@Index(['questionnaireId', 'sequence'])
export class ClinicQuestionnaireQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => ClinicQuestionnaire,
    (questionnaire) => questionnaire.questions,
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
    (question) => question.childQuestions,
    {
      onDelete: 'CASCADE',
      nullable: true,
    },
  )
  @JoinColumn({ name: 'parent_question_id' })
  parentQuestion?: ClinicQuestionnaireQuestion | null;

  @Column({ name: 'parent_question_id', nullable: true })
  parentQuestionId?: string | null;

  @OneToMany(
    () => ClinicQuestionnaireQuestion,
    (question) => question.parentQuestion,
  )
  childQuestions?: ClinicQuestionnaireQuestion[];

  @Column({ type: 'int' })
  sequence: number;

  @Column({ type: 'varchar', length: 32 })
  type: string;

  @Column({ type: 'text', nullable: true })
  text?: string | null;

  @Column({ name: 'sub_text', type: 'text', nullable: true })
  subText?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  placeholder?: string | null;

  @Column({ default: true })
  required: boolean;

  @Column({ name: 'repeat_enabled', default: false })
  repeatEnabled: boolean;

  @Column({ name: 'max_length', type: 'int', nullable: true })
  maxLength?: number | null;

  @Column({ name: 'max_count', type: 'int', nullable: true })
  maxCount?: number | null;

  @Column({
    name: 'regex_pattern',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  regexPattern?: string | null;

  @Column({
    name: 'validation_error_message',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  validationErrorMessage?: string | null;

  @Column({
    name: 'validation_max_date',
    type: 'varchar',
    length: 16,
    default: 'none',
  })
  validationMaxDate: string;

  @OneToMany(() => ClinicQuestionnaireAnswerOption, (option) => option.question)
  answerOptions?: ClinicQuestionnaireAnswerOption[];

  @OneToMany(
    () => ClinicQuestionnaireConstraint,
    (constraint) => constraint.question,
  )
  constraints?: ClinicQuestionnaireConstraint[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
