import { EXPLAIN_BOOKING_DATE_FORMAT_PROMPTS } from './ai-booking-date-format.fixtures.js';
import { rescueBookingDateFormatIntent } from './ai-booking-date-format.util.js';
import { handleExplainBookingDateFormatLogic } from './ai-business-date-format.logic.js';
import { AI_COMMAND_EVAL_BOOKING_DATE_FORMAT_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import type { Business } from '../business/entities/business.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

describe('ai booking date format integration (ai-cmd-fmt-4)', () => {
  const business: Business = makeBusiness({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
  });

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };

  const deps = () => ({ businessRepo });

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' };
    businessRepo.findOne.mockResolvedValue({ ...business });
  });

  it.each(EXPLAIN_BOOKING_DATE_FORMAT_PROMPTS.slice(0, 2))(
    'rescues and executes explain $id',
    async ({ prompt }) => {
      const rescued = rescueBookingDateFormatIntent(prompt, 'unknown');
      expect(rescued?.action).toBe('explain_booking_date_format');

      const result = await handleExplainBookingDateFormatLogic(deps(), 'biz-1');
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_booking_date_format');
      expect(result.summary).toContain('booking page');
      expect(result.summary).toContain('DD/MM/YYYY');
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_BOOKING_DATE_FORMAT_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
