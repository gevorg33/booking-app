import { handleCreateIntakeDraftLogic } from './ai-create-intake-draft.logic.js';
import { handleGetIntakeFlowStatusLogic } from './ai-get-intake-flow-status.logic.js';
import { handleStartPreVisitIntakeLogic } from './ai-start-pre-visit-intake.logic.js';
import { handleSubmitIntakeAnswersLogic } from './ai-submit-intake-answers.logic.js';
import type { ClinicBookingLogicDeps } from './ai-clinic-booking.logic.js';

function buildDeps(
  overrides: Partial<ClinicBookingLogicDeps> = {},
): ClinicBookingLogicDeps {
  const business = { id: 'biz-1', slug: 'salon' };
  const labService = {
    id: 'svc-lab-1',
    name: 'Blood Draw',
    metadata: { serviceType: 'lab_test' },
  };

  return {
    businessRepo: {
      findOne: jest.fn(async () => business),
    } as any,
    serviceService: {
      findAll: jest.fn(async () => [labService]),
    } as any,
    publicPreVisitIntakeService: {
      ensureCustomerDraft: jest.fn(async () => ({
        id: 'intake-1',
        status: 'assigned',
        questionnaireId: 'q-1',
        questionnaire: { title: 'Lab Intake' },
      })),
      getCustomerFlow: jest.fn(async () => ({
        id: 'intake-1',
        status: 'in_progress',
        isCompleted: false,
        questionnaire: { title: 'Lab Intake' },
        nextQuestion: { id: 'q-1', text: 'Any allergies?' },
      })),
      startCustomerIntake: jest.fn(async () => ({
        id: 'intake-1',
        status: 'in_progress',
        isCompleted: false,
        questionnaire: { title: 'Lab Intake' },
        nextQuestion: { id: 'q-1', text: 'Any allergies?' },
      })),
      submitCustomerAnswers: jest.fn(async () => ({
        id: 'intake-1',
        status: 'in_progress',
        isCompleted: false,
        questionnaire: { title: 'Lab Intake' },
        nextQuestion: { id: 'q-2', text: 'Currently on medication?' },
      })),
    } as any,
    ...overrides,
  };
}

describe('ai-create-intake-draft.logic', () => {
  let deps: ClinicBookingLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('creates a draft for a named lab service', async () => {
    const result = await handleCreateIntakeDraftLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      serviceName: 'Blood Draw',
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('create_intake_draft');
    expect(result.details?.intakeId).toBe('intake-1');
    expect(deps.publicPreVisitIntakeService.ensureCustomerDraft).toHaveBeenCalledWith(
      'salon',
      'cust-1',
      { serviceId: 'svc-lab-1', questionnaireId: undefined },
    );
  });

  it('requires sign-in', async () => {
    const result = await handleCreateIntakeDraftLogic(deps, 'biz-1', {});
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('clarifies when no lab test service is available at all', async () => {
    const noServiceDeps = buildDeps({
      serviceService: { findAll: jest.fn(async () => []) } as any,
    });
    const result = await handleCreateIntakeDraftLogic(noServiceDeps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      serviceName: 'Nonexistent',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails gracefully on service error', async () => {
    (
      deps.publicPreVisitIntakeService.ensureCustomerDraft as jest.Mock
    ).mockRejectedValueOnce(new Error('No published questionnaire'));
    const result = await handleCreateIntakeDraftLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      serviceName: 'Blood Draw',
    });
    expect(result.success).toBe(false);
    expect(result.summary).toBe('No published questionnaire');
  });
});

describe('ai-get-intake-flow-status.logic', () => {
  let deps: ClinicBookingLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('returns the current flow status', async () => {
    const result = await handleGetIntakeFlowStatusLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      intakeId: 'intake-1',
    });
    expect(result.success).toBe(true);
    expect(result.details?.nextQuestion).toEqual({
      id: 'q-1',
      text: 'Any allergies?',
    });
  });

  it('clarifies when intakeId is missing', async () => {
    const result = await handleGetIntakeFlowStatusLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails when the intake cannot be found', async () => {
    (
      deps.publicPreVisitIntakeService.getCustomerFlow as jest.Mock
    ).mockRejectedValueOnce(new Error('Intake not found'));
    const result = await handleGetIntakeFlowStatusLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      intakeId: 'bad-id',
    });
    expect(result.success).toBe(false);
  });
});

describe('ai-start-pre-visit-intake.logic', () => {
  let deps: ClinicBookingLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('starts the questionnaire and returns the first question', async () => {
    const result = await handleStartPreVisitIntakeLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      intakeId: 'intake-1',
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('start_pre_visit_intake');
    expect(result.details?.nextQuestion).toEqual({
      id: 'q-1',
      text: 'Any allergies?',
    });
  });

  it('clarifies when intakeId is missing', async () => {
    const result = await handleStartPreVisitIntakeLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});

describe('ai-submit-intake-answers.logic', () => {
  let deps: ClinicBookingLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('submits a single free-text answer against the current question', async () => {
    const result = await handleSubmitIntakeAnswersLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      intakeId: 'intake-1',
      answer: 'no allergies',
    });
    expect(result.success).toBe(true);
    expect(result.details?.submittedCount).toBe(1);
    expect(deps.publicPreVisitIntakeService.submitCustomerAnswers).toHaveBeenCalledWith(
      'salon',
      'cust-1',
      'intake-1',
      { questionId: 'q-1', values: ['no allergies'] },
    );
  });

  it('walks multiple free-text answers in order', async () => {
    (
      deps.publicPreVisitIntakeService.submitCustomerAnswers as jest.Mock
    )
      .mockResolvedValueOnce({
        id: 'intake-1',
        status: 'in_progress',
        isCompleted: false,
        questionnaire: { title: 'Lab Intake' },
        nextQuestion: { id: 'q-2', text: 'Currently on medication?' },
      })
      .mockResolvedValueOnce({
        id: 'intake-1',
        status: 'completed',
        isCompleted: true,
        questionnaire: { title: 'Lab Intake' },
        nextQuestion: null,
      });

    const result = await handleSubmitIntakeAnswersLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      intakeId: 'intake-1',
      answers: ["I don't smoke", 'not on medication'],
    });

    expect(result.success).toBe(true);
    expect(result.details?.submittedCount).toBe(2);
    expect(result.details?.isCompleted).toBe(true);
    expect(deps.publicPreVisitIntakeService.submitCustomerAnswers).toHaveBeenNthCalledWith(
      1,
      'salon',
      'cust-1',
      'intake-1',
      { questionId: 'q-1', values: ["I don't smoke"] },
    );
    expect(deps.publicPreVisitIntakeService.submitCustomerAnswers).toHaveBeenNthCalledWith(
      2,
      'salon',
      'cust-1',
      'intake-1',
      { questionId: 'q-2', values: ['not on medication'] },
    );
  });

  it('stops early once the intake is completed', async () => {
    (deps.publicPreVisitIntakeService.getCustomerFlow as jest.Mock).mockResolvedValueOnce(
      {
        id: 'intake-1',
        status: 'completed',
        isCompleted: true,
        questionnaire: { title: 'Lab Intake' },
        nextQuestion: null,
      },
    );
    const result = await handleSubmitIntakeAnswersLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      intakeId: 'intake-1',
      answers: ['extra answer'],
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(deps.publicPreVisitIntakeService.submitCustomerAnswers).not.toHaveBeenCalled();
  });

  it('clarifies when no answers are given', async () => {
    const result = await handleSubmitIntakeAnswersLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      intakeId: 'intake-1',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails gracefully when a submission errors', async () => {
    (
      deps.publicPreVisitIntakeService.submitCustomerAnswers as jest.Mock
    ).mockRejectedValueOnce(new Error('Intake is already completed'));
    const result = await handleSubmitIntakeAnswersLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      intakeId: 'intake-1',
      answer: 'no allergies',
    });
    expect(result.success).toBe(false);
    expect(result.summary).toBe('Intake is already completed');
  });
});
