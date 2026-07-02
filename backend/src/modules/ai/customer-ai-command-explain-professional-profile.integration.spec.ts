import { isAiProviderSpecialtyIntentForSurface } from './ai-provider-specialty-dispatch.util.js';
import { rescueExplainProfessionalProfileIntent } from './ai-explain-professional-profile.util.js';
import { EXPLAIN_PROFESSIONAL_PROFILE_PROMPTS } from './ai-explain-professional-profile.fixtures.js';
import { EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_SCENARIOS } from './ai-explain-professional-profile-multilingual.fixtures.js';

describe('customer-ai-command explain_professional_profile integration (ai-cmd-customer-4.11.5)', () => {
  it.each([
    ...EXPLAIN_PROFESSIONAL_PROFILE_PROMPTS,
    ...EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_SCENARIOS,
  ])(
    'registers and rescues explain_professional_profile for $id',
    ({ prompt, surface }) => {
      expect(
        isAiProviderSpecialtyIntentForSurface(
          'explain_professional_profile',
          surface,
        ),
      ).toBe(true);
      expect(
        rescueExplainProfessionalProfileIntent(
          prompt,
          'explain_provider_specialty',
        )?.action,
      ).toBe('explain_professional_profile');
    },
  );
});
