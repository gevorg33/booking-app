import { EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS } from './ai-explain-provider-availability.fixtures.js';
import { rescueExplainProviderAvailabilityIntent } from './ai-explain-provider-availability.util.js';
import { COMMAND_REGISTRY_BY_ID } from './ai-command-registry.js';

describe('customer-ai-command explain_provider_availability integration (ai-cmd-customer-4.11.3)', () => {
  it.each(
    EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ),
  )(
    'registers and rescues explain_provider_availability for $id',
    ({ prompt }) => {
      const entry = COMMAND_REGISTRY_BY_ID.get('explain_provider_availability');
      expect(entry?.surfaces).toContain('customer');
      expect(entry?.surfaces).toContain('public');
      expect(entry?.handler).toBe('PublicBookingAssistantService');
      expect(
        rescueExplainProviderAvailabilityIntent(prompt, 'check_availability')
          ?.action,
      ).toBe('explain_provider_availability');
    },
  );
});
