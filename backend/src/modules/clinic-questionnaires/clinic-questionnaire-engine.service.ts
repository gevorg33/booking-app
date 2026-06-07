import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import type { ClinicQuestionnaireAnswerMap } from '../../common/utils/clinic-questionnaire.types.js';
import {
  mergeAnswerMap,
  resolveInitialQuestionId,
  resolveNextQuestionId,
} from '../../common/utils/clinic-questionnaire-flow.util.js';
import { validateAnswerBatch } from '../../common/utils/clinic-questionnaire-validation.util.js';
import { ClinicQuestionnaireResponse } from './entities/clinic-questionnaire-response.entity.js';
import { ClinicQuestionnairesService } from './clinic-questionnaires.service.js';
import type {
  StartClinicQuestionnaireResponseDto,
  SubmitClinicQuestionnaireAnswersDto,
} from './dto/clinic-questionnaire.dto.js';
import { mapQuestionnaireResponseView } from './clinic-questionnaire-map.util.js';

@Injectable()
export class ClinicQuestionnaireEngineService {
  constructor(
    @InjectRepository(ClinicQuestionnaireResponse)
    private readonly responseRepo: Repository<ClinicQuestionnaireResponse>,
    private readonly questionnairesService: ClinicQuestionnairesService,
    private readonly businessService: BusinessService,
  ) {}

  async startResponse(
    businessId: string,
    userId: string,
    questionnaireId: string,
    dto: StartClinicQuestionnaireResponseDto,
  ) {
    await this.businessService.ensureMember(businessId, userId);
    const questionnaire =
      await this.questionnairesService.getPublishedQuestionnaireOrThrow(
        businessId,
        questionnaireId,
      );
    const ctx =
      await this.questionnairesService.loadFlowContext(questionnaireId);
    const initialQuestionId = resolveInitialQuestionId(ctx, {});

    const response = await this.responseRepo.save(
      this.responseRepo.create({
        businessId,
        questionnaireId: questionnaire.id,
        customerId: dto.customerId ?? null,
        bookingId: dto.bookingId ?? null,
        status: 'in_progress',
        currentQuestionId: initialQuestionId,
        answers: {},
      }),
    );

    return mapQuestionnaireResponseView(
      response,
      questionnaire,
      ctx,
      initialQuestionId,
    );
  }

  async getResponseFlow(
    businessId: string,
    userId: string,
    responseId: string,
  ) {
    await this.businessService.ensureMember(businessId, userId);
    const response = await this.getResponseOrThrow(businessId, responseId);
    const questionnaire =
      await this.questionnairesService.getPublishedQuestionnaireOrThrow(
        businessId,
        response.questionnaireId,
      );
    const ctx = await this.questionnairesService.loadFlowContext(
      response.questionnaireId,
    );
    const nextQuestionId =
      response.status === 'completed'
        ? null
        : (response.currentQuestionId ??
          resolveInitialQuestionId(ctx, response.answers));

    return mapQuestionnaireResponseView(
      response,
      questionnaire,
      ctx,
      nextQuestionId,
    );
  }

  async submitAnswers(
    businessId: string,
    userId: string,
    responseId: string,
    dto: SubmitClinicQuestionnaireAnswersDto,
  ) {
    await this.businessService.ensureMember(businessId, userId);
    return this.submitAnswersInternal(businessId, responseId, dto);
  }

  async startResponseForPublicCustomer(
    businessId: string,
    customerId: string,
    questionnaireId: string,
    dto: StartClinicQuestionnaireResponseDto,
  ) {
    if (dto.customerId && dto.customerId !== customerId) {
      throw new BadRequestException(
        'Customer mismatch for questionnaire response',
      );
    }

    const questionnaire =
      await this.questionnairesService.getPublishedQuestionnaireOrThrow(
        businessId,
        questionnaireId,
      );
    const ctx =
      await this.questionnairesService.loadFlowContext(questionnaireId);
    const initialQuestionId = resolveInitialQuestionId(ctx, {});

    const response = await this.responseRepo.save(
      this.responseRepo.create({
        businessId,
        questionnaireId: questionnaire.id,
        customerId,
        bookingId: dto.bookingId ?? null,
        status: 'in_progress',
        currentQuestionId: initialQuestionId,
        answers: {},
      }),
    );

    return mapQuestionnaireResponseView(
      response,
      questionnaire,
      ctx,
      initialQuestionId,
    );
  }

  async getResponseFlowForPublicCustomer(
    businessId: string,
    customerId: string,
    responseId: string,
  ) {
    const response = await this.getResponseForCustomerOrThrow(
      businessId,
      customerId,
      responseId,
    );
    const questionnaire =
      await this.questionnairesService.getPublishedQuestionnaireOrThrow(
        businessId,
        response.questionnaireId,
      );
    const ctx = await this.questionnairesService.loadFlowContext(
      response.questionnaireId,
    );
    const nextQuestionId =
      response.status === 'completed'
        ? null
        : (response.currentQuestionId ??
          resolveInitialQuestionId(ctx, response.answers));

    return mapQuestionnaireResponseView(
      response,
      questionnaire,
      ctx,
      nextQuestionId,
    );
  }

  async submitAnswersForPublicCustomer(
    businessId: string,
    customerId: string,
    responseId: string,
    dto: SubmitClinicQuestionnaireAnswersDto,
  ) {
    await this.getResponseForCustomerOrThrow(
      businessId,
      customerId,
      responseId,
    );
    return this.submitAnswersInternal(businessId, responseId, dto);
  }

  private async submitAnswersInternal(
    businessId: string,
    responseId: string,
    dto: SubmitClinicQuestionnaireAnswersDto,
  ) {
    const response = await this.getResponseOrThrow(businessId, responseId);
    if (response.status === 'completed') {
      throw new BadRequestException(
        'Questionnaire response is already completed',
      );
    }

    const questionnaire =
      await this.questionnairesService.getPublishedQuestionnaireOrThrow(
        businessId,
        response.questionnaireId,
      );
    const ctx = await this.questionnairesService.loadFlowContext(
      response.questionnaireId,
    );

    const questionId =
      dto.questionId ??
      response.currentQuestionId ??
      resolveInitialQuestionId(ctx, response.answers);
    if (!questionId) {
      throw new BadRequestException('No active question to answer');
    }

    const updates: ClinicQuestionnaireAnswerMap = {
      [questionId]: dto.values,
    };
    const validationErrors = validateAnswerBatch(ctx, updates);
    if (validationErrors.length) {
      throw new BadRequestException(validationErrors.join('\n'));
    }

    const mergedAnswers = mergeAnswerMap(response.answers ?? {}, updates);
    const nextQuestionId = resolveNextQuestionId(
      ctx,
      questionId,
      mergedAnswers,
    );
    const isCompleted = !nextQuestionId;

    response.answers = mergedAnswers;
    response.currentQuestionId = isCompleted ? null : nextQuestionId;
    response.status = isCompleted ? 'completed' : 'in_progress';
    response.completedAt = isCompleted ? new Date() : null;
    const saved = await this.responseRepo.save(response);

    return mapQuestionnaireResponseView(
      saved,
      questionnaire,
      ctx,
      isCompleted ? null : nextQuestionId,
    );
  }

  private async getResponseForCustomerOrThrow(
    businessId: string,
    customerId: string,
    responseId: string,
  ) {
    const response = await this.getResponseOrThrow(businessId, responseId);
    if (response.customerId !== customerId) {
      throw new NotFoundException('Questionnaire response not found');
    }
    return response;
  }

  private async getResponseOrThrow(businessId: string, responseId: string) {
    const response = await this.responseRepo.findOne({
      where: { id: responseId, businessId },
    });
    if (!response) {
      throw new NotFoundException('Questionnaire response not found');
    }
    return response;
  }

  async attachBookingToResponse(
    businessId: string,
    responseId: string,
    bookingId: string,
  ) {
    const response = await this.getResponseOrThrow(businessId, responseId);
    response.bookingId = bookingId;
    await this.responseRepo.save(response);
    return response;
  }
}
