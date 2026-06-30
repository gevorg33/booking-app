import { EXPLAIN_PROVIDER_SPECIALTY_PROMPTS } from './ai-explain-provider-specialty.util.js';
import { rescueExplainProviderSpecialtyIntent } from './ai-explain-provider-specialty.util.js';
import { isAiProviderSpecialtyIntentForSurface } from './ai-provider-specialty-dispatch.util.js';

describe('customer-ai-command explain_provider_specialty integration (ai-cmd-customer-4.1.6)', () => {
  it.each(
    EXPLAIN_PROVIDER_SPECIALTY_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues explain_provider_specialty for $id', (_id, row) => {
    expect(
      rescueExplainProviderSpecialtyIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_provider_specialty');
  });

  it('is registered on customer and public surfaces', () => {
    expect(
      isAiProviderSpecialtyIntentForSurface(
        'explain_provider_specialty',
        'customer',
      ),
    ).toBe(true);
    expect(
      isAiProviderSpecialtyIntentForSurface(
        'explain_provider_specialty',
        'public',
      ),
    ).toBe(true);
  });
});
