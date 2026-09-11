import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import { BOOK_ANOTHER_SERVICE_PROMPTS } from './ai-book-another-service.fixtures.js';
import { handleBookAnotherServiceLogic } from './ai-book-another-service.logic.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_BOOK_ANOTHER_SERVICE_CASES } from './eval/ai-command-eval.cases.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai-book-another-service integration (ai-cmd-customer-4.3.6)', () => {
  const business = { id: 'biz-1', name: 'Glow Salon' };
  const booking = {
    id: 'book-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    status: 'confirmed',
    startTime: new Date('2026-07-15T14:00:00Z'),
    service: { id: 'svc-haircut', name: 'Haircut' },
  };

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => business),
    },
    bookingRepo: {
      findOne: jest.fn(async () => booking),
      find: jest.fn(async () => []),
    },
    serviceRepo: {
      find: jest.fn(async () => []),
    },
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(BOOK_ANOTHER_SERVICE_PROMPTS)(
    'rescues book_another_service for $id',
    ({ prompt }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe('book_another_service');

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'book_another_service',
          params: {},
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_BOOK_ANOTHER_SERVICE_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it('executes logic with freshBook navigate payload', async () => {
    const result = await handleBookAnotherServiceLogic(
      deps() as any,
      'biz-1',
      { bookingId: 'book-1', sessionCustomerId: 'cust-1' },
      'Book another service same day',
    );
    expect(result.success).toBe(true);
    expect(result.details.navigate?.query?.freshBook).toBe('1');
  });
});
