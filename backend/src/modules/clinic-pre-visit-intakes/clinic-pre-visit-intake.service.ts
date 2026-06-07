import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { ClinicQuestionnaireEngineService } from '../clinic-questionnaires/clinic-questionnaire-engine.service.js';
import { ClinicQuestionnairesService } from '../clinic-questionnaires/clinic-questionnaires.service.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { PatientClinicalProfileAccessService } from '../patient-clinical-profiles/shared/patient-clinical-profile-access.service.js';
import { ClinicPreVisitIntake } from './entities/clinic-pre-visit-intake.entity.js';
import type {
  AssignClinicPreVisitIntakeDto,
  SubmitClinicPreVisitIntakeAnswersDto,
} from './dto/clinic-pre-visit-intake.dto.js';
import {
  mapPreVisitIntakeFlowView,
  mapPreVisitIntakeSummary,
} from './clinic-pre-visit-intake-map.util.js';
import {
  canStartPreVisitIntake,
  canSubmitPreVisitIntakeAnswers,
  mapResponseStatusToIntakeStatus,
  pickDefaultIntakeQuestionnaireId,
} from './clinic-pre-visit-intake.util.js';
import { canLinkPreVisitIntakeToBooking } from '../../common/utils/clinic-public-pre-visit-intake.util.js';

@Injectable()
export class ClinicPreVisitIntakeService {
  constructor(
    @InjectRepository(ClinicPreVisitIntake)
    private readonly intakeRepo: Repository<ClinicPreVisitIntake>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly businessService: BusinessService,
    private readonly questionnairesService: ClinicQuestionnairesService,
    private readonly questionnaireEngineService: ClinicQuestionnaireEngineService,
    private readonly clinicalProfileAccessService: PatientClinicalProfileAccessService,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  async listForCustomer(
    businessId: string,
    userId: string,
    customerId: string,
    bookingId?: string | null,
  ) {
    await this.clinicalProfileAccessService.assertCustomerClinicalProfileAccess(
      businessId,
      userId,
      customerId,
    );
    await this.assertEnabled(businessId);

    const where: Record<string, unknown> = { businessId, customerId };
    if (bookingId) where.bookingId = bookingId;

    const intakes = await this.intakeRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      intakes.map(async (intake) => {
        const questionnaire =
          await this.questionnairesService.getPublishedQuestionnaireOrThrow(
            businessId,
            intake.questionnaireId,
          );
        return mapPreVisitIntakeSummary(intake, questionnaire);
      }),
    );
  }

  async getForBooking(businessId: string, userId: string, bookingId: string) {
    await this.businessService.ensureMember(businessId, userId);
    await this.assertEnabled(businessId);

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId },
      select: { id: true, customerId: true },
    });
    if (!booking?.customerId) {
      throw new NotFoundException('Booking not found');
    }

    await this.clinicalProfileAccessService.assertCustomerClinicalProfileAccess(
      businessId,
      userId,
      booking.customerId,
    );

    const intakes = await this.intakeRepo.find({
      where: { businessId, bookingId },
      order: { createdAt: 'DESC' },
      take: 1,
    });
    const intake = intakes[0];
    if (!intake) {
      return null;
    }

    const questionnaire = await this.questionnairesServicesGetPublished(
      businessId,
      intake.questionnaireId,
    );
    return mapPreVisitIntakeSummary(intake, questionnaire);
  }

  async assignForBooking(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: AssignClinicPreVisitIntakeDto,
  ) {
    const existing = await this.getForBooking(businessId, userId, bookingId);
    if (existing) {
      return existing;
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId },
      select: { id: true, customerId: true },
    });
    if (!booking?.customerId) {
      throw new NotFoundException('Booking not found');
    }

    return this.assignForCustomer(businessId, userId, booking.customerId, {
      ...dto,
      bookingId,
    });
  }

  async assignForCustomer(
    businessId: string,
    userId: string,
    customerId: string,
    dto: AssignClinicPreVisitIntakeDto,
  ) {
    const access =
      await this.clinicalProfileAccessService.assertCustomerClinicalProfileAccess(
        businessId,
        userId,
        customerId,
      );
    await this.assertEnabled(businessId);

    if (dto.bookingId) {
      const booking = await this.bookingRepo.findOne({
        where: { id: dto.bookingId, businessId, customerId },
        select: { id: true },
      });
      if (!booking) {
        throw new BadRequestException(
          'Booking does not belong to this patient',
        );
      }

      for (const status of ['assigned', 'in_progress'] as const) {
        const existing = await this.intakeRepo.findOne({
          where: {
            businessId,
            bookingId: dto.bookingId,
            status,
          },
        });
        if (existing) {
          const questionnaire = await this.questionnairesServicesGetPublished(
            businessId,
            existing.questionnaireId,
          );
          return mapPreVisitIntakeSummary(existing, questionnaire);
        }
      }
    }

    const questionnaireId = await this.resolveQuestionnaireId(
      businessId,
      dto.questionnaireId,
    );
    await this.questionnairesServicesGetPublished(businessId, questionnaireId);

    const saved = await this.intakeRepo.save(
      this.intakeRepo.create({
        businessId,
        customerId,
        bookingId: dto.bookingId ?? null,
        questionnaireId,
        responseId: null,
        status: 'assigned',
        assignedByEmployeeId: access.ctx.employeeId,
      }),
    );

    const questionnaire = await this.questionnairesServicesGetPublished(
      businessId,
      saved.questionnaireId,
    );
    return mapPreVisitIntakeSummary(saved, questionnaire);
  }

  async getIntakeFlow(businessId: string, userId: string, intakeId: string) {
    const intake = await this.getIntakeOrThrow(businessId, userId, intakeId);
    return this.buildFlowView(businessId, userId, intake);
  }

  async startIntake(businessId: string, userId: string, intakeId: string) {
    const intake = await this.getIntakeOrThrow(businessId, userId, intakeId);
    if (intake.responseId) {
      return this.buildFlowView(businessId, userId, intake);
    }
    if (!canStartPreVisitIntake(intake.status)) {
      throw new BadRequestException(
        'Intake cannot be started in its current status',
      );
    }

    const started = await this.questionnaireEngineService.startResponse(
      businessId,
      userId,
      intake.questionnaireId,
      {
        customerId: intake.customerId,
        bookingId: intake.bookingId ?? null,
      },
    );

    intake.responseId = started.id;
    intake.status = 'in_progress';
    await this.intakeRepo.save(intake);

    return mapPreVisitIntakeFlowView({
      intake,
      questionnaire: started.questionnaire,
      nextQuestion: started.nextQuestion,
      answers: started.answers,
      isCompleted: started.isCompleted,
    });
  }

  async submitAnswers(
    businessId: string,
    userId: string,
    intakeId: string,
    dto: SubmitClinicPreVisitIntakeAnswersDto,
  ) {
    let intake = await this.getIntakeOrThrow(businessId, userId, intakeId);
    if (!canSubmitPreVisitIntakeAnswers(intake.status)) {
      throw new BadRequestException('Intake is already completed');
    }

    if (!intake.responseId) {
      await this.startIntake(businessId, userId, intakeId);
      intake = await this.getIntakeOrThrow(businessId, userId, intakeId);
    }

    const submitted = await this.questionnaireEngineService.submitAnswers(
      businessId,
      userId,
      intake.responseId!,
      dto,
    );

    intake.status = mapResponseStatusToIntakeStatus(
      submitted.status,
      intake.status,
    );
    if (submitted.isCompleted) {
      intake.completedAt = new Date();
    }
    await this.intakeRepo.save(intake);

    return mapPreVisitIntakeFlowView({
      intake,
      questionnaire: submitted.questionnaire,
      nextQuestion: submitted.nextQuestion,
      answers: submitted.answers,
      isCompleted: submitted.isCompleted,
    });
  }

  async assignDraftForPublicCustomer(
    businessId: string,
    customerId: string,
    questionnaireId?: string | null,
  ) {
    await this.assertEnabled(businessId);

    for (const status of ['assigned', 'in_progress'] as const) {
      const existing = await this.intakeRepo
        .createQueryBuilder('intake')
        .where('intake.businessId = :businessId', { businessId })
        .andWhere('intake.customerId = :customerId', { customerId })
        .andWhere('intake.bookingId IS NULL')
        .andWhere('intake.status = :status', { status })
        .orderBy('intake.updatedAt', 'DESC')
        .getOne();
      if (existing) {
        const questionnaire = await this.questionnairesServicesGetPublished(
          businessId,
          existing.questionnaireId,
        );
        return mapPreVisitIntakeSummary(existing, questionnaire);
      }
    }

    const resolvedQuestionnaireId = await this.resolveQuestionnaireId(
      businessId,
      questionnaireId,
    );
    await this.questionnairesServicesGetPublished(
      businessId,
      resolvedQuestionnaireId,
    );

    const saved = await this.intakeRepo.save(
      this.intakeRepo.create({
        businessId,
        customerId,
        bookingId: null,
        questionnaireId: resolvedQuestionnaireId,
        responseId: null,
        status: 'assigned',
        assignedByEmployeeId: null,
      }),
    );

    const questionnaire = await this.questionnairesServicesGetPublished(
      businessId,
      saved.questionnaireId,
    );
    return mapPreVisitIntakeSummary(saved, questionnaire);
  }

  async getIntakeFlowForPublicCustomer(
    businessId: string,
    customerId: string,
    intakeId: string,
  ) {
    const intake = await this.getIntakeForPublicCustomerOrThrow(
      businessId,
      customerId,
      intakeId,
    );
    return this.buildPublicFlowView(businessId, customerId, intake);
  }

  async startIntakeForPublicCustomer(
    businessId: string,
    customerId: string,
    intakeId: string,
  ) {
    const intake = await this.getIntakeForPublicCustomerOrThrow(
      businessId,
      customerId,
      intakeId,
    );
    if (intake.responseId) {
      return this.buildPublicFlowView(businessId, customerId, intake);
    }
    if (!canStartPreVisitIntake(intake.status)) {
      throw new BadRequestException(
        'Intake cannot be started in its current status',
      );
    }

    const started =
      await this.questionnaireEngineService.startResponseForPublicCustomer(
        businessId,
        customerId,
        intake.questionnaireId,
        {
          customerId,
          bookingId: intake.bookingId ?? null,
        },
      );

    intake.responseId = started.id;
    intake.status = 'in_progress';
    await this.intakeRepo.save(intake);

    return mapPreVisitIntakeFlowView({
      intake,
      questionnaire: started.questionnaire,
      nextQuestion: started.nextQuestion,
      answers: started.answers,
      isCompleted: started.isCompleted,
    });
  }

  async submitAnswersForPublicCustomer(
    businessId: string,
    customerId: string,
    intakeId: string,
    dto: SubmitClinicPreVisitIntakeAnswersDto,
  ) {
    let intake = await this.getIntakeForPublicCustomerOrThrow(
      businessId,
      customerId,
      intakeId,
    );
    if (!canSubmitPreVisitIntakeAnswers(intake.status)) {
      throw new BadRequestException('Intake is already completed');
    }

    if (!intake.responseId) {
      await this.startIntakeForPublicCustomer(businessId, customerId, intakeId);
      intake = await this.getIntakeForPublicCustomerOrThrow(
        businessId,
        customerId,
        intakeId,
      );
    }

    const submitted =
      await this.questionnaireEngineService.submitAnswersForPublicCustomer(
        businessId,
        customerId,
        intake.responseId!,
        dto,
      );

    intake.status = mapResponseStatusToIntakeStatus(
      submitted.status,
      intake.status,
    );
    if (submitted.isCompleted) {
      intake.completedAt = new Date();
    }
    await this.intakeRepo.save(intake);

    return mapPreVisitIntakeFlowView({
      intake,
      questionnaire: submitted.questionnaire,
      nextQuestion: submitted.nextQuestion,
      answers: submitted.answers,
      isCompleted: submitted.isCompleted,
    });
  }

  async linkIntakeToBooking(
    businessId: string,
    customerId: string,
    intakeId: string,
    bookingId: string,
  ) {
    const intake = await this.getIntakeForPublicCustomerOrThrow(
      businessId,
      customerId,
      intakeId,
    );

    if (
      !canLinkPreVisitIntakeToBooking({
        intakeCustomerId: intake.customerId,
        bookingCustomerId: customerId,
        intakeBookingId: intake.bookingId,
      })
    ) {
      throw new BadRequestException('Intake cannot be linked to this booking');
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId, customerId },
      select: { id: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    intake.bookingId = bookingId;
    await this.intakeRepo.save(intake);

    if (intake.responseId) {
      await this.questionnaireEngineService.attachBookingToResponse(
        businessId,
        intake.responseId,
        bookingId,
      );
    }

    const questionnaire = await this.questionnairesServicesGetPublished(
      businessId,
      intake.questionnaireId,
    );
    return mapPreVisitIntakeSummary(intake, questionnaire);
  }

  async hasPublishedIntakeQuestionnaire(businessId: string): Promise<boolean> {
    try {
      await this.assertEnabled(businessId);
    } catch {
      return false;
    }
    const published =
      await this.questionnairesService.listPublishedQuestionnairesForIntake(
        businessId,
      );
    return (
      pickDefaultIntakeQuestionnaireId({
        questionnaires: published,
      }) != null
    );
  }

  async getDefaultIntakeQuestionnairePreview(businessId: string) {
    await this.assertEnabled(businessId);
    const published =
      await this.questionnairesService.listPublishedQuestionnairesForIntake(
        businessId,
      );
    const questionnaireId = pickDefaultIntakeQuestionnaireId({
      questionnaires: published,
    });
    if (!questionnaireId) return null;

    const questionnaire = published.find(
      (entry) => entry.id === questionnaireId,
    );
    if (!questionnaire) return null;

    return {
      id: questionnaire.id,
      title: questionnaire.title,
      code: questionnaire.code,
      introTitle: questionnaire.introTitle ?? null,
      introBody: questionnaire.introBody ?? null,
    };
  }

  private async buildPublicFlowView(
    businessId: string,
    customerId: string,
    intake: ClinicPreVisitIntake,
  ) {
    if (!intake.responseId) {
      const questionnaire = await this.questionnairesServicesGetPublished(
        businessId,
        intake.questionnaireId,
      );
      return mapPreVisitIntakeFlowView({
        intake,
        questionnaire,
        nextQuestion: null,
        answers: {},
        isCompleted: false,
      });
    }

    const flow =
      await this.questionnaireEngineService.getResponseFlowForPublicCustomer(
        businessId,
        customerId,
        intake.responseId,
      );

    intake.status = mapResponseStatusToIntakeStatus(flow.status, intake.status);
    if (flow.isCompleted && !intake.completedAt) {
      intake.completedAt = new Date();
      await this.intakeRepo.save(intake);
    }

    return mapPreVisitIntakeFlowView({
      intake,
      questionnaire: flow.questionnaire,
      nextQuestion: flow.nextQuestion,
      answers: flow.answers,
      isCompleted: flow.isCompleted,
    });
  }

  private async getIntakeForPublicCustomerOrThrow(
    businessId: string,
    customerId: string,
    intakeId: string,
  ) {
    const intake = await this.intakeRepo.findOne({
      where: { id: intakeId, businessId },
    });
    if (!intake || intake.customerId !== customerId) {
      throw new NotFoundException('Pre-visit intake not found');
    }
    await this.assertEnabled(businessId);
    return intake;
  }

  private async buildFlowView(
    businessId: string,
    userId: string,
    intake: ClinicPreVisitIntake,
  ) {
    if (!intake.responseId) {
      const questionnaire = await this.questionnairesServicesGetPublished(
        businessId,
        intake.questionnaireId,
      );
      return mapPreVisitIntakeFlowView({
        intake,
        questionnaire,
        nextQuestion: null,
        answers: {},
        isCompleted: false,
      });
    }

    const flow = await this.questionnaireEngineService.getResponseFlow(
      businessId,
      userId,
      intake.responseId,
    );

    intake.status = mapResponseStatusToIntakeStatus(flow.status, intake.status);
    if (flow.isCompleted && !intake.completedAt) {
      intake.completedAt = new Date();
      await this.intakeRepo.save(intake);
    }

    return mapPreVisitIntakeFlowView({
      intake,
      questionnaire: flow.questionnaire,
      nextQuestion: flow.nextQuestion,
      answers: flow.answers,
      isCompleted: flow.isCompleted,
    });
  }

  private async getIntakeOrThrow(
    businessId: string,
    userId: string,
    intakeId: string,
  ) {
    const intake = await this.intakeRepo.findOne({
      where: { id: intakeId, businessId },
    });
    if (!intake) {
      throw new NotFoundException('Pre-visit intake not found');
    }

    await this.clinicalProfileAccessService.assertCustomerClinicalProfileAccess(
      businessId,
      userId,
      intake.customerId,
    );
    await this.assertEnabled(businessId);
    return intake;
  }

  private async resolveQuestionnaireId(
    businessId: string,
    questionnaireId?: string | null,
  ) {
    if (questionnaireId) return questionnaireId;

    const published =
      await this.questionnairesService.listPublishedQuestionnairesForIntake(
        businessId,
      );
    const resolved = pickDefaultIntakeQuestionnaireId({
      preferredQuestionnaireId: questionnaireId,
      questionnaires: published,
    });

    if (!resolved) {
      throw new BadRequestException(
        'No published intake questionnaire is configured for this clinic',
      );
    }

    return resolved;
  }

  private questionnairesServicesGetPublished(
    businessId: string,
    questionnaireId: string,
  ) {
    return this.questionnairesService.getPublishedQuestionnaireOrThrow(
      businessId,
      questionnaireId,
    );
  }
}
