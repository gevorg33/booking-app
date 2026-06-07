import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClinicPreVisitIntakeService } from './clinic-pre-visit-intake.service.js';

describe('ClinicPreVisitIntakeService public customer flows (integration)', () => {
  const businessId = 'biz-1';
  const customerId = 'cust-1';

  const intakeRepo = {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(async () => null),
    })),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...value,
      id: 'intake-1',
      createdAt: new Date('2026-06-21T10:00:00.000Z'),
      updatedAt: new Date('2026-06-21T10:00:00.000Z'),
    })),
    findOne: jest.fn(async ({ where }: { where: { id?: string } }) => ({
      id: where.id ?? 'intake-1',
      businessId,
      customerId,
      bookingId: null,
      questionnaireId: 'quest-1',
      responseId: null,
      status: 'assigned',
      createdAt: new Date('2026-06-21T10:00:00.000Z'),
      updatedAt: new Date('2026-06-21T10:00:00.000Z'),
    })),
  };

  const bookingRepo = {
    findOne: jest.fn(async () => ({ id: 'booking-1' })),
  };

  const businessService = {
    findOne: jest.fn(async () => ({
      id: businessId,
      settings: { businessType: 'polyclinic' },
    })),
  };

  const questionnairesService = {
    listPublishedQuestionnairesForIntake: jest.fn(async () => [
      {
        id: 'quest-1',
        code: 'pre-visit-intake',
        title: 'Pre-visit intake',
        status: 'published',
        isActive: true,
      },
    ]),
    getPublishedQuestionnaireOrThrow: jest.fn(async () => ({
      id: 'quest-1',
      title: 'Pre-visit intake',
      code: 'pre-visit-intake',
      revision: 1,
      introTitle: null,
      introBody: null,
    })),
  };

  const questionnaireEngineService = {
    startResponseForPublicCustomer: jest.fn(async () => ({
      id: 'resp-1',
      questionnaire: {
        id: 'quest-1',
        title: 'Pre-visit intake',
        code: 'pre-visit-intake',
        revision: 1,
        introTitle: null,
        introBody: null,
      },
      nextQuestion: { id: 'q-1', type: 'text', text: 'Any allergies?' },
      answers: {},
      isCompleted: false,
    })),
    getResponseFlowForPublicCustomer: jest.fn(async () => ({
      status: 'in_progress',
      questionnaire: {
        id: 'quest-1',
        title: 'Pre-visit intake',
        code: 'pre-visit-intake',
        revision: 1,
        introTitle: null,
        introBody: null,
      },
      nextQuestion: { id: 'q-1', type: 'text', text: 'Any allergies?' },
      answers: {},
      isCompleted: false,
    })),
    submitAnswersForPublicCustomer: jest.fn(async () => ({
      status: 'completed',
      questionnaire: {
        id: 'quest-1',
        title: 'Pre-visit intake',
        code: 'pre-visit-intake',
        revision: 1,
        introTitle: null,
        introBody: null,
      },
      nextQuestion: null,
      answers: { 'q-1': ['None'] },
      isCompleted: true,
    })),
    attachBookingToResponse: jest.fn(async () => ({})),
  };

  const accessService = {
    assertCustomerClinicalProfileAccess: jest.fn(),
  };

  const service = new ClinicPreVisitIntakeService(
    intakeRepo as never,
    bookingRepo as never,
    businessService as never,
    questionnairesService as never,
    questionnaireEngineService as never,
    accessService as never,
  );

  it('assigns a public customer draft intake', async () => {
    const summary = await service.assignDraftForPublicCustomer(
      businessId,
      customerId,
    );

    expect(summary.id).toBe('intake-1');
    expect(summary.status).toBe('assigned');
  });

  it('starts and submits answers for a public customer intake', async () => {
    const flow = await service.getIntakeFlowForPublicCustomer(
      businessId,
      customerId,
      'intake-1',
    );
    expect(flow.nextQuestion).toBeNull();

    const started = await service.startIntakeForPublicCustomer(
      businessId,
      customerId,
      'intake-1',
    );

    expect(started.responseId).toBe('resp-1');

    const completed = await service.submitAnswersForPublicCustomer(
      businessId,
      customerId,
      'intake-1',
      { values: ['None'] },
    );

    expect(completed.isCompleted).toBe(true);
  });

  it('links a draft intake to a booking', async () => {
    intakeRepo.findOne.mockResolvedValueOnce({
      id: 'intake-1',
      businessId,
      customerId,
      bookingId: null,
      questionnaireId: 'quest-1',
      responseId: 'resp-1',
      status: 'in_progress',
      createdAt: new Date('2026-06-21T10:00:00.000Z'),
      updatedAt: new Date('2026-06-21T10:00:00.000Z'),
    });

    const linked = await service.linkIntakeToBooking(
      businessId,
      customerId,
      'intake-1',
      'booking-1',
    );

    expect(linked.bookingId).toBe('booking-1');
    expect(
      questionnaireEngineService.attachBookingToResponse,
    ).toHaveBeenCalled();
  });

  it('rejects linking when intake belongs to another customer', async () => {
    intakeRepo.findOne.mockResolvedValueOnce({
      id: 'intake-1',
      businessId,
      customerId: 'other',
      bookingId: null,
      questionnaireId: 'quest-1',
      status: 'assigned',
    });

    await expect(
      service.linkIntakeToBooking(
        businessId,
        customerId,
        'intake-1',
        'booking-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects linking when intake is already tied to a booking', async () => {
    intakeRepo.findOne.mockResolvedValueOnce({
      id: 'intake-1',
      businessId,
      customerId,
      bookingId: 'booking-old',
      questionnaireId: 'quest-1',
      status: 'in_progress',
    });

    await expect(
      service.linkIntakeToBooking(
        businessId,
        customerId,
        'intake-1',
        'booking-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
