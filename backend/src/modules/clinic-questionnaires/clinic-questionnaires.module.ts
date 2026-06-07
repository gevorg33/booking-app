import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessModule } from '../business/business.module.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ClinicQuestionnaire } from './entities/clinic-questionnaire.entity.js';
import { ClinicQuestionnaireQuestion } from './entities/clinic-questionnaire-question.entity.js';
import { ClinicQuestionnaireAnswerOption } from './entities/clinic-questionnaire-answer-option.entity.js';
import { ClinicQuestionnaireConstraint } from './entities/clinic-questionnaire-constraint.entity.js';
import { ClinicQuestionnaireResponse } from './entities/clinic-questionnaire-response.entity.js';
import { ClinicQuestionnairesController } from './clinic-questionnaires.controller.js';
import { ClinicQuestionnairesService } from './clinic-questionnaires.service.js';
import { ClinicQuestionnaireEngineService } from './clinic-questionnaire-engine.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicQuestionnaire,
      ClinicQuestionnaireQuestion,
      ClinicQuestionnaireAnswerOption,
      ClinicQuestionnaireConstraint,
      ClinicQuestionnaireResponse,
      Employee,
    ]),
    BusinessModule,
  ],
  controllers: [ClinicQuestionnairesController],
  providers: [ClinicQuestionnairesService, ClinicQuestionnaireEngineService],
  exports: [ClinicQuestionnairesService, ClinicQuestionnaireEngineService],
})
export class ClinicQuestionnairesModule {}
