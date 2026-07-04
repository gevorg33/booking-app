import { describe, expect, it, jest } from '@jest/globals';
import {
  handleAssignPreVisitIntakeToBookingLogic,
  type ClinicPreVisitIntakeLogicDeps,
} from './ai-clinic-pre-visit-intake.logic.js';

function buildDeps(
  overrides: Record<string, any> = {},
): ClinicPreVisitIntakeLogicDeps {
  return {
    intakeService: {
      assignForBooking: jest.fn(async (_businessId: string, _userId: string, bookingId: string, _dto: any) => ({
        id: 'intake-1',
        bookingId,
        status: 'assigned',
      })),
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
