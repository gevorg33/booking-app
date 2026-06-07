import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { canManageExternalDoctorsRegistry } from '../../common/utils/external-doctor-access.util.js';
import type { ClinicLabStaffContext } from '../../common/utils/clinic-lab-access.util.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ClinicQuestionnaire } from './entities/clinic-questionnaire.entity.js';
import { ClinicQuestionnaireQuestion } from './entities/clinic-questionnaire-question.entity.js';
import { ClinicQuestionnaireAnswerOption } from './entities/clinic-questionnaire-answer-option.entity.js';
import { ClinicQuestionnaireConstraint } from './entities/clinic-questionnaire-constraint.entity.js';
import type {
  CreateClinicQuestionnaireDto,
  ReplaceClinicQuestionnaireDefinitionDto,
  UpdateClinicQuestionnaireDto,
} from './dto/clinic-questionnaire.dto.js';
import {
  buildFlowContextFromEntities,
  mapQuestionnaireDefinition,
  mapQuestionnaireSummary,
} from './clinic-questionnaire-map.util.js';

@Injectable()
export class ClinicQuestionnairesService {
  constructor(
    @InjectRepository(ClinicQuestionnaire)
    private readonly questionnaireRepo: Repository<ClinicQuestionnaire>,
    @InjectRepository(ClinicQuestionnaireQuestion)
    private readonly questionRepo: Repository<ClinicQuestionnaireQuestion>,
    @InjectRepository(ClinicQuestionnaireAnswerOption)
    private readonly optionRepo: Repository<ClinicQuestionnaireAnswerOption>,
    @InjectRepository(ClinicQuestionnaireConstraint)
    private readonly constraintRepo: Repository<ClinicQuestionnaireConstraint>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly businessService: BusinessService,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  private async resolveStaffContext(
    businessId: string,
    userId: string,
  ): Promise<ClinicLabStaffContext> {
    const membership = await this.businessService.ensureMember(
      businessId,
      userId,
    );
    const employee = await this.employeeRepo.findOne({
      where: { businessId, userId, isActive: true },
      select: { id: true },
    });
    return {
      userId,
      membershipRole: membership.role,
      employeeId: employee?.id ?? null,
    };
  }

  private async assertManageAccess(businessId: string, userId: string) {
    await this.assertEnabled(businessId);
    const ctx = await this.resolveStaffContext(businessId, userId);
    if (!canManageExternalDoctorsRegistry(ctx)) {
      throw new ForbiddenException(
        'You do not have permission to manage clinic questionnaires',
      );
    }
    return ctx;
  }

  async listQuestionnaires(businessId: string, userId: string) {
    await this.businessService.ensureMember(businessId, userId);
    await this.assertEnabled(businessId);
    const questionnaires = await this.questionnaireRepo.find({
      where: { businessId },
      order: { updatedAt: 'DESC' },
    });
    return questionnaires.map(mapQuestionnaireSummary);
  }

  async listPublishedQuestionnairesForIntake(businessId: string) {
    await this.assertEnabled(businessId);
    const questionnaires = await this.questionnaireRepo.find({
      where: { businessId, status: 'published', isActive: true },
      order: { updatedAt: 'DESC' },
    });
    return questionnaires.map(mapQuestionnaireSummary);
  }

  async createQuestionnaire(
    businessId: string,
    userId: string,
    dto: CreateClinicQuestionnaireDto,
  ) {
    await this.assertManageAccess(businessId, userId);
    const existing = await this.questionnaireRepo.findOne({
      where: { businessId, code: dto.code.trim() },
    });
    if (existing) {
      throw new BadRequestException('Questionnaire code already exists');
    }

    const saved = await this.questionnaireRepo.save(
      this.questionnaireRepo.create({
        businessId,
        code: dto.code.trim(),
        internalName: dto.internalName.trim(),
        title: dto.title.trim(),
        introTitle: dto.introTitle?.trim() || null,
        introBody: dto.introBody?.trim() || null,
        status: 'draft',
        revision: 1,
        isActive: true,
      }),
    );
    return mapQuestionnaireSummary(saved);
  }

  async updateQuestionnaire(
    businessId: string,
    userId: string,
    questionnaireId: string,
    dto: UpdateClinicQuestionnaireDto,
  ) {
    await this.assertManageAccess(businessId, userId);
    const questionnaire = await this.getQuestionnaireOrThrow(
      businessId,
      questionnaireId,
    );
    if (dto.internalName !== undefined) {
      questionnaire.internalName = dto.internalName.trim();
    }
    if (dto.title !== undefined) questionnaire.title = dto.title.trim();
    if (dto.introTitle !== undefined) {
      questionnaire.introTitle = dto.introTitle?.trim() || null;
    }
    if (dto.introBody !== undefined) {
      questionnaire.introBody = dto.introBody?.trim() || null;
    }
    if (dto.isActive !== undefined) questionnaire.isActive = dto.isActive;
    if (questionnaire.status === 'published') {
      questionnaire.status = 'draft';
      questionnaire.publishedAt = null;
    }
    const saved = await this.questionnaireRepo.save(questionnaire);
    return mapQuestionnaireSummary(saved);
  }

  async getQuestionnaireDefinition(
    businessId: string,
    userId: string,
    questionnaireId: string,
  ) {
    await this.businessService.ensureMember(businessId, userId);
    await this.assertEnabled(businessId);
    const questionnaire = await this.getQuestionnaireOrThrow(
      businessId,
      questionnaireId,
    );
    const ctx = await this.loadFlowContext(questionnaireId);
    return mapQuestionnaireDefinition(questionnaire, ctx);
  }

  async replaceQuestionnaireDefinition(
    businessId: string,
    userId: string,
    questionnaireId: string,
    dto: ReplaceClinicQuestionnaireDefinitionDto,
  ) {
    await this.assertManageAccess(businessId, userId);
    const questionnaire = await this.getQuestionnaireOrThrow(
      businessId,
      questionnaireId,
    );

    const keys = dto.questions.map((question) => question.key);
    if (new Set(keys).size !== keys.length) {
      throw new BadRequestException('Question keys must be unique');
    }

    await this.questionRepo.delete({ questionnaireId });

    const keyToId = new Map<string, string>();
    const sortedQuestions = dto.questions
      .slice()
      .sort((a, b) => a.sequence - b.sequence);

    for (const questionInput of sortedQuestions) {
      if (questionInput.parentKey && !keys.includes(questionInput.parentKey)) {
        throw new BadRequestException(
          `Unknown parentKey ${questionInput.parentKey}`,
        );
      }
      const savedQuestion = await this.questionRepo.save(
        this.questionRepo.create({
          questionnaireId,
          parentQuestionId: questionInput.parentKey
            ? (keyToId.get(questionInput.parentKey) ?? null)
            : null,
          sequence: questionInput.sequence,
          type: questionInput.type,
          text: questionInput.text?.trim() || null,
          subText: questionInput.subText?.trim() || null,
          placeholder: questionInput.placeholder?.trim() || null,
          required: questionInput.required ?? true,
          repeatEnabled: questionInput.repeatEnabled ?? false,
          maxLength: questionInput.maxLength ?? null,
          maxCount: questionInput.maxCount ?? null,
          regexPattern: questionInput.regexPattern?.trim() || null,
          validationErrorMessage:
            questionInput.validationErrorMessage?.trim() || null,
          validationMaxDate: questionInput.validationMaxDate ?? 'none',
        }),
      );
      keyToId.set(questionInput.key, savedQuestion.id);

      if (questionInput.answerOptions?.length) {
        for (const [
          index,
          optionInput,
        ] of questionInput.answerOptions.entries()) {
          await this.optionRepo.save(
            this.optionRepo.create({
              questionId: savedQuestion.id,
              display: optionInput.display.trim(),
              value: optionInput.value.trim(),
              sequence: optionInput.sequence ?? index + 1,
            }),
          );
        }
      }
    }

    const options = await this.optionRepo
      .createQueryBuilder('option')
      .innerJoin('option.question', 'question')
      .where('question.questionnaireId = :questionnaireId', { questionnaireId })
      .getMany();

    const optionLookup = new Map<string, string>();
    for (const option of options) {
      optionLookup.set(`${option.questionId}:${option.value}`, option.id);
    }

    for (const constraintInput of dto.constraints ?? []) {
      const questionId = keyToId.get(constraintInput.questionKey);
      const constraintQuestionId = keyToId.get(
        constraintInput.constraintQuestionKey,
      );
      if (!questionId || !constraintQuestionId) {
        throw new BadRequestException(
          'Constraint references unknown question key',
        );
      }

      let answerOptionId: string | null = null;
      if (constraintInput.answerOptionValue) {
        answerOptionId =
          optionLookup.get(
            `${constraintQuestionId}:${constraintInput.answerOptionValue.trim()}`,
          ) ?? null;
        if (!answerOptionId) {
          throw new BadRequestException(
            'Constraint references unknown answer option value',
          );
        }
      }

      await this.constraintRepo.save(
        this.constraintRepo.create({
          questionnaireId,
          questionId,
          constraintQuestionId,
          answerOptionId,
          staticAnswer: constraintInput.staticAnswer?.trim() || null,
        }),
      );
    }

    questionnaire.status = 'draft';
    questionnaire.publishedAt = null;
    questionnaire.revision += 1;
    await this.questionnaireRepo.save(questionnaire);

    const ctx = await this.loadFlowContext(questionnaireId);
    return mapQuestionnaireDefinition(questionnaire, ctx);
  }

  async publishQuestionnaire(
    businessId: string,
    userId: string,
    questionnaireId: string,
  ) {
    await this.assertManageAccess(businessId, userId);
    const questionnaire = await this.getQuestionnaireOrThrow(
      businessId,
      questionnaireId,
    );
    const questionCount = await this.questionRepo.count({
      where: { questionnaireId },
    });
    if (!questionCount) {
      throw new BadRequestException(
        'Add at least one question before publishing',
      );
    }
    questionnaire.status = 'published';
    questionnaire.publishedAt = new Date();
    questionnaire.isActive = true;
    const saved = await this.questionnaireRepo.save(questionnaire);
    return mapQuestionnaireSummary(saved);
  }

  async getPublishedQuestionnaireOrThrow(
    businessId: string,
    questionnaireId: string,
  ) {
    await this.assertEnabled(businessId);
    const questionnaire = await this.questionnaireRepo.findOne({
      where: {
        id: questionnaireId,
        businessId,
        status: 'published',
        isActive: true,
      },
    });
    if (!questionnaire) {
      throw new NotFoundException('Published questionnaire not found');
    }
    return questionnaire;
  }

  async loadFlowContext(questionnaireId: string) {
    const [questions, options, constraints] = await Promise.all([
      this.questionRepo.find({
        where: { questionnaireId },
        order: { sequence: 'ASC' },
      }),
      this.optionRepo
        .createQueryBuilder('option')
        .innerJoin('option.question', 'question')
        .where('question.questionnaireId = :questionnaireId', {
          questionnaireId,
        })
        .orderBy('option.sequence', 'ASC')
        .getMany(),
      this.constraintRepo.find({ where: { questionnaireId } }),
    ]);
    return buildFlowContextFromEntities({ questions, options, constraints });
  }

  private async getQuestionnaireOrThrow(
    businessId: string,
    questionnaireId: string,
  ) {
    const questionnaire = await this.questionnaireRepo.findOne({
      where: { id: questionnaireId, businessId },
    });
    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }
    return questionnaire;
  }
}
