import { describe, expect, it, jest } from '@jest/globals';
import { AiClinicPreVisitIntakeService } from './ai-clinic-pre-visit-intake.service.js';

describe('AiClinicPreVisitIntakeService (ai-cmd-dashboard-6.3.3)', () => {
  function buildService() {
    const intakeService = {
      assignForBooking: jest.fn(
        async (
          _businessId: string,
          _userId: string,
          bookingId: string,
          _dto: any,
        ) => ({
          id: 'intake-1',
          bookingId,
        }),
      ),
    };
    const service = new AiClinicPreVisitIntakeService(intakeService as any);
    return { service, intakeService };
  }

  it('handleAssignPreVisitIntakeToBooking delegates to the service', async () => {
    const { service, intakeService } = buildService();
    const result = await service.handleAssignPreVisitIntakeToBooking(
      'biz-1',
      'user-1',
      { bookingId: 'b1' },
    );
    expect(result.action).toBe('assign_pre_visit_intake_to_booking');
    expect(intakeService.assignForBooking).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'b1',
      { questionnaireId: undefined },
    );
  });

  it('exposes rescue + detector passthroughs', () => {
    const { service } = buildService();
    expect(
      service.rescueClinicPreVisitIntakeIntent(
        'assign a pre-visit intake to this booking',
        'unknown',
      ),
    ).toEqual({
      action: 'assign_pre_visit_intake_to_booking',
      rescueReason: 'assign_intake',
    });
    expect(
      service.isAssignPreVisitIntakeToBookingPrompt(
        'assign intake to booking b1',
      ),
    ).toBe(true);
  });
});
