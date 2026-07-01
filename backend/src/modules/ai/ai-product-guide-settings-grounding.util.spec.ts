import {
  collectSettingsPathsFromGuideText,
  collectUnknownSettingsPathIssues,
  GUIDE_GROUNDED_SETTINGS_PATHS,
  isGroundedSettingsPath,
} from './ai-product-guide-settings-grounding.util.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import { resolveGuideCorpusTopic } from './guide/ai-guide-corpus.util.js';
import { verifyGuideResponseGrounding } from './ai-product-guide-grounding.util.js';

describe('ai-product-guide-settings-grounding.util (ai-guide-1.2.4)', () => {
  it('accepts known settings paths and prefix children', () => {
    expect(isGroundedSettingsPath('notifications')).toBe(true);
    expect(isGroundedSettingsPath('tax.rules')).toBe(true);
    expect(isGroundedSettingsPath('integrations.openAi')).toBe(true);
    expect(isGroundedSettingsPath('fakePaymentToggle')).toBe(false);
  });

  it('extracts dotted settings paths from guide copy', () => {
    expect(
      collectSettingsPathsFromGuideText(
        'Check settings.notifications and business.settings.tax.rules before saving.',
      ),
    ).toEqual(['notifications', 'tax.rules']);
  });

  it('flags unknown settings paths when validation is enabled', () => {
    const issues = collectUnknownSettingsPathIssues(
      'Turn on settings.fakeFeature in business.settings.fakeFeature.',
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe('unknown_setting_key');
    expect(issues[0]?.value).toBe('fakeFeature');
  });

  it('allows corpus-specific settings paths during polish grounding', () => {
    const result = verifyGuideResponseGrounding(
      {
        summary: 'Use settings.customWorkflowFlag from this playbook.',
        steps: [{ title: 'Step 1', body: 'Save settings.customWorkflowFlag.' }],
        topicId: 'dashboard.core.schedule',
        sources: [{ topicId: 'dashboard.core.schedule', kind: 'topic' }],
      },
      {
        validateSettingsKeys: true,
        corpusSettingsPaths: ['customWorkflowFlag'],
      },
    );
    expect(result.ok).toBe(true);
  });

  it('extracts settings paths from resolved corpus topics when present', () => {
    const messages = getFrontendGuideCorpusMessages('en');
    const resolved = resolveGuideCorpusTopic(
      'dashboard.ai.getting-started',
      messages,
    );
    expect(resolved).toBeTruthy();
    expect(GUIDE_GROUNDED_SETTINGS_PATHS.size).toBeGreaterThan(10);
  });
});
