import { EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS } from './ai-explain-any-provider-option.fixtures.js';
import { rescueExplainAnyProviderOptionIntent } from './ai-explain-any-provider-option.util.js';
import { isAiProviderSpecialtyIntentForSurface } from './ai-provider-specialty-dispatch.util.js';

describe('customer-ai-command explain_any_provider_option integration (ai-cmd-customer-4.11.1)', () => {
  it.each(
    EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues explain_any_provider_option for $id', (_id, row) => {
    expect(
      rescueExplainAnyProviderOptionIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_any_provider_option');
  });

  it('is registered on customer and public surfaces', () => {
    expect(
      isAiProviderSpecialtyIntentForSurface(
        'explain_any_provider_option',
        'customer',
      ),
    ).toBe(true);
    expect(
      isAiProviderSpecialtyIntentForSurface(
        'explain_any_provider_option',
        'public',
      ),
    ).toBe(true);
  });
});
