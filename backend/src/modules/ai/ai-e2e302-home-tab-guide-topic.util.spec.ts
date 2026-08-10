import {
  E2E302_CLARIFY_LOCALE_CASES,
  E2E302_CONTROL_CASES,
  E2E302_HOME_TAB_TOPIC_CASES,
} from './ai-e2e302-home-tab-guide-topic.fixtures.js';
import {
  enrichGuideTopicFromPrompt,
  isProviderHomeOrTodayTabGuidePrompt,
} from './ai-product-guide-rescue.util.js';
import {
  buildGuideClarifyResult,
  resolveGuideClarifyLocale,
} from './ai-product-guide-match.util.js';
import { parseProviderProductGuideIntentFromPrompt } from './ai-product-guide-completion.util.js';
import { isMyStatsPrompt } from './ai-provider-exp-2.util.js';

describe('e2e-bug.302: HY Home-tab guide topic + localized clarify', () => {
  it.each(E2E302_HOME_TAB_TOPIC_CASES)(
    'enrich topic $id',
    ({ prompt, expectTopicId }) => {
      expect(isProviderHomeOrTodayTabGuidePrompt(prompt)).toBe(true);
      expect(enrichGuideTopicFromPrompt(prompt, { surface: 'provider' })).toBe(
        expectTopicId,
      );
    },
  );

  it.each(E2E302_CLARIFY_LOCALE_CASES)(
    'clarify $id',
    ({ locale, prompt, expectFragment, forbid }) => {
      expect(resolveGuideClarifyLocale(locale, prompt)).not.toBeUndefined();
      const result = buildGuideClarifyResult(
        'guide_user_flow',
        { flowBest: null, corpusBest: null },
        null,
        undefined,
        locale,
        prompt,
      );
      expect(result.success).toBe(false);
      expect(result.summary).toContain(expectFragment);
      expect(result.summary).not.toContain(forbid);
    },
  );

  it.each(E2E302_CONTROL_CASES)('control $id', ({ prompt, forbidTopic }) => {
    expect(isMyStatsPrompt(prompt)).toBe(true);
    expect(isProviderHomeOrTodayTabGuidePrompt(prompt)).toBe(false);
    expect(
      enrichGuideTopicFromPrompt(prompt, { surface: 'provider' }),
    ).not.toBe(forbidTopic);
  });

  it('EN and HY Home tab share provider-today-calendar', () => {
    expect(
      enrichGuideTopicFromPrompt('How do I use the Home tab?', {
        surface: 'provider',
      }),
    ).toBe(
      enrichGuideTopicFromPrompt('Ինչպե՞ս օգտագործեմ Home tab-ը', {
        surface: 'provider',
      }),
    );
  });

  it.each([
    'Как пользоваться вкладкой Home?',
    'Как пользоваться вкладкой Today?',
    'How do I use the Home tab?',
    'Ինչպե՞ս օգտագործեմ Home tab-ը',
  ])('explain_provider_app_tabs validates Home/Today cue: %s', (prompt) => {
    expect(
      parseProviderProductGuideIntentFromPrompt(
        'explain_provider_app_tabs',
        prompt,
      ),
    ).toBe(true);
  });
});
