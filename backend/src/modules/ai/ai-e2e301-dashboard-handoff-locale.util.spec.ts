import {
  E2E301_FALLBACK_CASES,
  E2E301_LOCALIZED_SUMMARY_CASES,
} from './ai-e2e301-dashboard-handoff-locale.fixtures.js';
import {
  buildExplainDashboardOnlyActionFallbackSummary,
  resolveDashboardHandoffLocale,
  resolveDashboardOnlyActionSummaryFromPrompt,
} from './ai-provider-dashboard-handoff.util.js';
import { t } from '../../common/i18n/messages.js';

describe('e2e-bug.301: explain_dashboard_only_action summaries localize', () => {
  it.each(E2E301_LOCALIZED_SUMMARY_CASES)(
    'summary $id',
    ({ prompt, locale, expectActionFragment, forbidEnglishFragments }) => {
      const summary = resolveDashboardOnlyActionSummaryFromPrompt(
        prompt,
        locale,
      );
      expect(summary).toBeTruthy();
      expect(summary!).toContain(expectActionFragment);
      expect(summary!).toMatch(/dashboard|վահանակ|панел/i);

      const resolved = resolveDashboardHandoffLocale(locale, prompt);
      if (resolved !== 'en') {
        expect(summary!).not.toMatch(
          /isn't available from the mobile assistant/i,
        );
      }
      for (const frag of forbidEnglishFragments ?? []) {
        expect(summary!).not.toContain(frag);
      }
    },
  );

  it.each(E2E301_FALLBACK_CASES)(
    'fallback $id',
    ({ locale, expectFragment, forbid }) => {
      const summary = buildExplainDashboardOnlyActionFallbackSummary(locale);
      expect(summary).toContain(expectFragment);
      expect(summary).not.toContain(forbid);
    },
  );

  it('hy/ru templates differ from en', () => {
    expect(t('hy', 'assistant.dashboardHandoffTemplate')).not.toBe(
      t('en', 'assistant.dashboardHandoffTemplate'),
    );
    expect(t('ru', 'assistant.dashboardHandoffTemplate')).not.toBe(
      t('en', 'assistant.dashboardHandoffTemplate'),
    );
  });

  it('script inference picks hy/ru without explicit locale', () => {
    expect(
      resolveDashboardHandoffLocale(
        undefined,
        'Ինչու չեմ կարող զանգահարել հաճախորդին',
      ),
    ).toBe('hy');
    expect(
      resolveDashboardHandoffLocale(
        undefined,
        'Почему я не могу позвонить клиенту?',
      ),
    ).toBe('ru');
    expect(
      resolveDashboardHandoffLocale(undefined, "Why can't I call the client?"),
    ).toBe('en');
  });
});
