import { validateCommand } from './command-completion.validator.js';
import { handleExplainClinicBookingLogic } from './ai-clinic-booking.logic.js';
import {
  CLINIC_BOOKING_RESCUE_SCENARIOS,
  EXPLAIN_CLINIC_BOOKING_PROMPTS,
} from './ai-clinic-booking.fixtures.js';
import { rescueExplainClinicBookingIntent } from './ai-clinic-booking.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai clinic booking integration (ai-cmd-clinic-5)', () => {
  const businessRepo = { findOne: jest.fn() };
  const serviceService = { findAll: jest.fn() };
  const publicPreVisitIntakeService = {
    ensureCustomerDraft: jest.fn(),
    getCustomerFlow: jest.fn(),
    startCustomerIntake: jest.fn(),
    submitCustomerAnswers: jest.fn(),
    getCheckoutConfig: jest.fn(),
  };

  const deps = { businessRepo, serviceService, publicPreVisitIntakeService };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    });
    serviceService.findAll.mockResolvedValue([
      {
        id: 'svc-lipid',
        name: 'Lipid panel',
        metadata: {
          serviceType: 'lab_test',
          requiresFasting: true,
          preparationNotes: 'Fast 12 hours before draw.',
        },
      },
      {
        id: 'svc-cbc',
        name: 'CBC',
        metadata: { serviceType: 'lab_test', requiresFasting: false },
      },
    ]);
  });

  it.each(EXPLAIN_CLINIC_BOOKING_PROMPTS)(
    'validates and executes $id',
    async ({ prompt, serviceName }) => {
      const validation = validateCommand(
        makeResolvedCommand({
          action: 'explain_clinic_booking',
          params: serviceName ? { serviceName } : {},
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleExplainClinicBookingLogic(
        deps,
        'biz-1',
        serviceName ? { serviceName } : {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_clinic_booking');
    },
  );

  it.each(CLINIC_BOOKING_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainClinicBookingIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: expectedAction,
      });
    },
  );
});
