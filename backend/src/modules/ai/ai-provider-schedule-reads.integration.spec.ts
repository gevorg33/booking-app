import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { PROVIDER_SCHEDULE_READS_PROMPTS } from './ai-provider-schedule-reads.fixtures.js';

describe('ai provider schedule reads rescue (ai-cmd-provider-6.2)', () => {
  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(PROVIDER_SCHEDULE_READS_PROMPTS)(
    'rescues $id to $expectedAction',
    ({ prompt, expectedAction }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe(expectedAction);
    },
  );
});
