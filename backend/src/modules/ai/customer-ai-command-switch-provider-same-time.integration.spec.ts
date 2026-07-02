import { isAiProviderSpecialtyIntentForSurface } from './ai-provider-specialty-dispatch.util.js';
import { rescueSwitchProviderSameTimeIntent } from './ai-switch-provider-same-time.util.js';
import { SWITCH_PROVIDER_SAME_TIME_PROMPTS } from './ai-switch-provider-same-time.fixtures.js';
import { SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_SCENARIOS } from './ai-switch-provider-same-time-multilingual.fixtures.js';

describe('customer-ai-command switch_provider_same_time integration (ai-cmd-customer-4.11.4)', () => {
  it.each([
    ...SWITCH_PROVIDER_SAME_TIME_PROMPTS,
    ...SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_SCENARIOS,
  ])(
    'registers and rescues switch_provider_same_time for $id',
    ({ prompt, surface }) => {
      expect(
        isAiProviderSpecialtyIntentForSurface(
          'switch_provider_same_time',
          surface,
        ),
      ).toBe(true);
      expect(
        isAiProviderSpecialtyIntentForSurface(
          'switch_provider_same_time',
          surface === 'customer' ? 'public' : 'customer',
        ),
      ).toBe(true);
      expect(
        rescueSwitchProviderSameTimeIntent(prompt, 'book_appointment')?.action,
      ).toBe('switch_provider_same_time');
    },
  );
});
