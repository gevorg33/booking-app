import { Test } from '@nestjs/testing';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  CLINIC_COMPOUND_RESCUE_SCENARIOS,
  CLINIC_COMPOUND_SCENARIOS,
} from './ai-clinic-compound.fixtures.js';
import {
  decomposeClinicCompoundPrompt,
  isClinicCompoundPrompt,
} from './ai-clinic-compound.util.js';
import { decomposeDeterministicForSurface } from './intent-decomposition.util.js';
import { executeCustomerCompoundFromSteps } from './customer-ai-command.logic.js';

describe('ai-clinic-compound integration (ai-cmd-clinic-v2-7)', () => {
  let rescueService: AiIntentRescueService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AiIntentRescueService],
    }).compile();
    rescueService = moduleRef.get(AiIntentRescueService);
  });

  it.each(CLINIC_COMPOUND_SCENARIOS)(
    'deterministic decomposition for $surface $id',
    ({ prompt, surface, orderedActions }) => {
      const result = decomposeDeterministicForSurface(surface, prompt);
      expect(result).not.toBeNull();
      expect(result!.steps.map((step) => step.action)).toEqual(orderedActions);
      expect(isClinicCompoundPrompt(prompt, surface)).toBe(true);
      expect(decomposeClinicCompoundPrompt(prompt, surface)).toHaveLength(2);
    },
  );

  it.each(CLINIC_COMPOUND_RESCUE_SCENARIOS)(
    'rescue service routes compound $id',
    ({ prompt, misclassifiedAction }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: misclassifiedAction!,
        params: {},
      });
      expect(rescued?.action).toBe('compound_intent');
      expect(rescued?.rescueReason).toBe('clinic_compound');
    },
  );

  it('executes customer clinic compound steps via dispatch', async () => {
    const prompt = 'Book lipid panel and notify me when results are ready';
    const steps = decomposeClinicCompoundPrompt(prompt, 'customer');
    const deps = {
      payments: {
        dispatchIntent: jest.fn(async ({ action }: { action: string }) => ({
          success: true,
          action,
          summary: 'Booked',
          details: { serviceName: 'lipid panel' },
        })),
      },
      consumerClinicTestResults: {
        handleNotifyWhenResultsReady: jest.fn(async () => ({
          success: true,
          action: 'notify_when_results_ready',
          summary: 'Explained',
          details: {},
        })),
      },
    } as any;

    const result = await executeCustomerCompoundFromSteps(
      deps,
      'biz-1',
      prompt,
      steps,
      { customerId: 'cust-1', prompt },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('compound_intent');
    expect(deps.payments.dispatchIntent).toHaveBeenCalled();
    expect(
      deps.consumerClinicTestResults.handleNotifyWhenResultsReady,
    ).toHaveBeenCalled();
  });
});
