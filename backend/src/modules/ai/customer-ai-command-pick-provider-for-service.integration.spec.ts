import { PICK_PROVIDER_FOR_SERVICE_PROMPTS } from './ai-pick-provider-for-service.fixtures.js';
import { isAiProviderSpecialtyIntentForSurface } from './ai-provider-specialty-dispatch.util.js';
import { rescuePickProviderForServiceIntent } from './ai-pick-provider-for-service.util.js';

describe('customer-ai-command pick_provider_for_service integration (ai-cmd-customer-4.11.2)', () => {
  it.each(
    PICK_PROVIDER_FOR_SERVICE_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ),
  )('registers and rescues pick_provider_for_service for $id', ({ prompt }) => {
    expect(
      isAiProviderSpecialtyIntentForSurface(
        'pick_provider_for_service',
        'customer',
      ),
    ).toBe(true);
    expect(
      isAiProviderSpecialtyIntentForSurface(
        'pick_provider_for_service',
        'public',
      ),
    ).toBe(true);
    expect(
      rescuePickProviderForServiceIntent(prompt, 'book_appointment')?.action,
    ).toBe('pick_provider_for_service');
  });
});
