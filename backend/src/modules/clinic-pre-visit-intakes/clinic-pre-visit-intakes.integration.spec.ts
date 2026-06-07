import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ClinicPreVisitIntakeService } from './clinic-pre-visit-intake.service.js';
import {
  ASSIGN_CLINIC_PRE_VISIT_INTAKE_PAYLOAD,
  CLINIC_PRE_VISIT_INTAKE_FIXTURES,
} from './clinic-pre-visit-intake.fixtures.js';

describe('ClinicPreVisitIntakeService (integration)', () => {
  const businessId = 'biz-1';
  const customerId = 'cust-1';
  const bookingId = 'booking-1';
  const intakeId = CLINIC_PRE_VISIT_INTAKE_FIXTURES.assignedChartIntake.id;
  const questionnaireId = 'quest-1';

  let intakeRecord = {
    id: intakeId,
    businessId,
    customerId,
    bookingId: null as string | null,
    questionnaireId,
    responseId: null as string | null,
    status: 'assigned',
    assignedByEmployeeId: 'emp-1',
    completedAt: null as Date | null,
    createdAt: new Date('2026-06-20T12:00:00.000Z'),
    updatedAt: new Date('2026-06-20T12:00:00.000Z'),
  };

  const questionnaire = {
    id: questionnaireId,
    businessId,
    code: 'referral-intake',
    internalName: 'Referral intake',
    title: 'Referral intake questionnaire',
    introTitle: 'Before your visit',
    introBody: 'Answer a few questions.',
    revision: 1,
    status: 'published',
    isActive: true,
    publishedAt: new Date('2026-06-19T12:00:00.000Z'),
    createdAt: new Date('2026-06-19T12:00:00.000Z'),
    updatedAt: new Date('2026-06-19T12:00:00.000Z'),
  };

  const intakeRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => {
      intakeRecord = { ...intakeRecord, ...value };
      return intakeRecord;
    }),
    find: jest.fn(async () => [intakeRecord]),
    findOne: jest.fn(async (query: { where: Record<string, unknown> }) => {
      const where = query.where;
      if (where.id && where.id !== intakeRecord.id) return null;
      if (where.businessId && where.businessId !== businessId) return null;
      if (where.bookingId && where.bookingId !== intakeRecord.bookingId)
        return null;
      if (where.status && where.status !== intakeRecord.status) return null;
      return intakeRecord;
    }),
  };

  const bookingRepo = {
    findOne: jest.fn(async (query: { where: Record<string, unknown> }) => {
      if (query.where.id === bookingId) {
        return { id: bookingId, customerId, businessId };
      }
      return null;
    }),
  };

  const businessService = {
    ensureMember: jest.fn(async () => ({ role: 'manager' })),
    findOne: jest.fn(async () => ({
      id: businessId,
      settings: { businessType: 'polyclinic' },
    })),
  };

  const clinicalProfileAccessService = {
    assertCustomerClinicalProfileAccess: jest.fn(async () => ({
      ctx: { userId: 'user-1', membershipRole: 'manager', employeeId: 'emp-1' },
      phiAccess: { hasAssignedBooking: true },
    })),
  };

  const questionnairesService = {
    getPublishedQuestionnaireOrThrow: jest.fn(async () => questionnaire),
    listPublishedQuestionnairesForIntake: jest.fn(async () => [
      {
        id: questionnaireId,
        code: 'referral-intake',
        status: 'published',
        isActive: true,
      },
    ]),
  };

  const questionnaireEngineService = {
    startResponse: jest.fn(async () => ({
      id: 'resp-1',
      status: 'in_progress',
      answers: {},
      isCompleted: false,
      questionnaire: {
        id: questionnaireId,
        title: questionnaire.title,
        revision: questionnaire.revision,
        introTitle: questionnaire.introTitle,
        introBody: questionnaire.introBody,
      },
      nextQuestion: { id: 'q-referral', type: 'choice', text: 'Referred?' },
    })),
    getResponseFlow: jest.fn(async () => ({
      status: 'in_progress',
      answers: { 'q-referral': ['yes'] },
      isCompleted: false,
      questionnaire: {
        id: questionnaireId,
        title: questionnaire.title,
        revision: questionnaire.revision,
        introTitle: questionnaire.introTitle,
        introBody: questionnaire.introBody,
      },
      nextQuestion: { id: 'q-symptoms', type: 'text', text: 'Symptoms' },
    })),
    submitAnswers: jest.fn(async () => ({
      status: 'completed',
      answers: { 'q-referral': ['no'], 'q-symptoms': ['Headache'] },
      isCompleted: true,
      questionnaire: {
        id: questionnaireId,
        title: questionnaire.title,
        revision: questionnaire.revision,
        introTitle: questionnaire.introTitle,
        introBody: questionnaire.introBody,
      },
      nextQuestion: null,
    })),
  };

  const service = new ClinicPreVisitIntakeService(
    intakeRepo as never,
    bookingRepo as never,
    businessService as never,
    questionnairesService as never,
    questionnaireEngineService as never,
    clinicalProfileAccessService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    intakeRepo.findOne.mockImplementation(
      async (query: { where: Record<string, unknown> }) => {
        const where = query.where;
        if (where.id && where.id !== intakeRecord.id) return null;
        if (where.businessId && where.businessId !== businessId) return null;
        if (where.bookingId && where.bookingId !== intakeRecord.bookingId)
          return null;
        if (where.status && where.status !== intakeRecord.status) return null;
        return intakeRecord;
      },
    );
    intakeRecord = {
      ...intakeRecord,
      bookingId: null,
      responseId: null,
      status: 'assigned',
      completedAt: null,
    };
  });

  it('lists intakes for a customer', async () => {
    const list = await service.listForCustomer(
      businessId,
      'user-1',
      customerId,
    );

    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(intakeId);
  });

  it('assigns a chart-level intake', async () => {
    const assigned = await service.assignForCustomer(
      businessId,
      'user-1',
      customerId,
      ASSIGN_CLINIC_PRE_VISIT_INTAKE_PAYLOAD,
    );

    expect(assigned.status).toBe('assigned');
    expect(assigned.questionnaire.code).toBe('referral-intake');
  });

  it('returns existing booking intake instead of creating duplicate', async () => {
    intakeRecord.bookingId = bookingId;
    intakeRecord.status = 'in_progress';

    const assigned = await service.assignForBooking(
      businessId,
      'user-1',
      bookingId,
      {},
    );

    expect(assigned.id).toBe(intakeId);
    expect(intakeRepo.save).not.toHaveBeenCalled();
  });

  it('starts intake and returns first question', async () => {
    const started = await service.startIntake(businessId, 'user-1', intakeId);

    expect(started.nextQuestion?.id).toBe('q-referral');
    expect(intakeRecord.status).toBe('in_progress');
  });

  it('submits answers and completes intake', async () => {
    intakeRecord.responseId = 'resp-1';
    intakeRecord.status = 'in_progress';

    const completed = await service.submitAnswers(
      businessId,
      'user-1',
      intakeId,
      {
        questionId: 'q-symptoms',
        values: ['Headache'],
      },
    );

    expect(completed.isCompleted).toBe(true);
    expect(intakeRecord.status).toBe('completed');
  });

  it('rejects access when clinical profile access fails', async () => {
    clinicalProfileAccessService.assertCustomerClinicalProfileAccess.mockRejectedValueOnce(
      new ForbiddenException(),
    );

    await expect(
      service.listForCustomer(businessId, 'user-1', customerId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('loads intake flow for an assigned intake', async () => {
    const flow = await service.getIntakeFlow(businessId, 'user-1', intakeId);

    expect(flow.status).toBe('assigned');
    expect(flow.nextQuestion).toBeNull();
  });

  it('loads booking intake summary', async () => {
    intakeRecord.bookingId = bookingId;

    const summary = await service.getForBooking(
      businessId,
      'user-1',
      bookingId,
    );

    expect(summary?.id).toBe(intakeId);
  });

  it('rejects assignment when no published questionnaire exists', async () => {
    questionnairesService.listPublishedQuestionnairesForIntake.mockResolvedValueOnce(
      [],
    );

    await expect(
      service.assignForCustomer(businessId, 'user-1', customerId, {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
