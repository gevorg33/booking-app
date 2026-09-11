import { describe, expect, it, jest } from '@jest/globals';
import {
  handleAssignPreVisitIntakeToBookingLogic,
  handleStaffSubmitIntakeAnswersLogic,
  type ClinicPreVisitIntakeLogicDeps,
} from './ai-clinic-pre-visit-intake.logic.js';

function buildDeps(
  overrides: Record<string, any> = {},
): ClinicPreVisitIntakeLogicDeps {
  return {
    intakeService: {
      assignForBooking: jest.fn(
        async (
          _businessId: string,
          _userId: string,
          bookingId: string,
          _dto: any,
        ) => ({
          id: 'intake-1',
          bookingId,
          status: 'assigned',
        }),
      ),
      getForBooking: jest.fn(
        async (_businessId: string, _userId: string, bookingId: string) => ({
          id: 'intake-1',
          bookingId,
          status: 'assigned',
        }),
      ),
      submitAnswers: jest.fn(
        async (
          _businessId: string,
          _userId: string,
          intakeId: string,
          dto: any,
        ) => ({
          id: intakeId,
          status: 'in_progress',
          ...dto,
        }),
      ),
      ...overrides.intakeService,
    },
  } as any;
}

describe('ai-clinic-pre-visit-intake.logic (ai-cmd-dashboard-6.3.3)', () => {
  it('asks for clarification when bookingId is missing', async () => {
    const deps = buildDeps();
    const result = await handleAssignPreVisitIntakeToBookingLogic(
      deps,
      'biz-1',
      'user-1',
      {},
    );
    expect(result.success).toBe(false);
    expect(result.details).toMatchObject({ clarify: true });
  });

  it('assigns the intake to the booking', async () => {
    const deps = buildDeps();
    const result = await handleAssignPreVisitIntakeToBookingLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b1' },
    );
    expect(result.success).toBe(true);
    expect(deps.intakeService.assignForBooking).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'b1',
      { questionnaireId: undefined },
    );
  });

  it('passes questionnaireId through when given', async () => {
    const deps = buildDeps();
    await handleAssignPreVisitIntakeToBookingLogic(deps, 'biz-1', 'user-1', {
      bookingId: 'b1',
      questionnaireId: 'q1',
    });
    expect(deps.intakeService.assignForBooking).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'b1',
      { questionnaireId: 'q1' },
    );
  });

  it('handles errors gracefully', async () => {
    const deps = buildDeps({
      intakeService: {
        assignForBooking: jest.fn(async () => {
          throw new Error('Booking does not belong to this patient');
        }),
      },
    });
    const result = await handleAssignPreVisitIntakeToBookingLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b1' },
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Booking does not belong');
  });
});

describe('handleStaffSubmitIntakeAnswersLogic (ai-cmd-dashboard-6.8.2)', () => {
  it('asks for clarification when bookingId or values are missing', async () => {
    const deps = buildDeps();
    const result = await handleStaffSubmitIntakeAnswersLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b1' },
    );
    expect(result.success).toBe(false);
    expect(result.details).toMatchObject({ clarify: true });
  });

  it('fails when no intake is assigned to the booking', async () => {
    const deps = buildDeps({
      intakeService: { getForBooking: jest.fn(async () => null) },
    });
    const result = await handleStaffSubmitIntakeAnswersLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b1', values: ['yes'] },
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/No pre-visit intake/);
  });

  it('submits the answers for the resolved intake', async () => {
    const deps = buildDeps();
    const result = await handleStaffSubmitIntakeAnswersLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b1', values: ['yes'], questionId: 'q1' },
    );
    expect(result.success).toBe(true);
    expect(deps.intakeService.getForBooking).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'b1',
    );
    expect(deps.intakeService.submitAnswers).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'intake-1',
      { questionId: 'q1', values: ['yes'] },
    );
  });

  it('accepts a single string value', async () => {
    const deps = buildDeps();
    const result = await handleStaffSubmitIntakeAnswersLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b1', values: 'yes' },
    );
    expect(result.success).toBe(true);
    expect(deps.intakeService.submitAnswers).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'intake-1',
      { questionId: undefined, values: ['yes'] },
    );
  });

  it('handles errors gracefully', async () => {
    const deps = buildDeps({
      intakeService: {
        submitAnswers: jest.fn(async () => {
          throw new Error('Intake is already completed');
        }),
      },
    });
    const result = await handleStaffSubmitIntakeAnswersLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b1', values: ['yes'] },
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('already completed');
  });
});
