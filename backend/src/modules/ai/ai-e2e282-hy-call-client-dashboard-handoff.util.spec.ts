import {
  E2E282_CALL_HANDOFF_CASES,
  E2E282_CONTROL_CASES,
} from './ai-e2e282-hy-call-client-dashboard-handoff.fixtures.js';
import {
  isExplainDashboardOnlyActionPrompt,
  isWhyCantCallClientDashboardHandoffPrompt,
  rescueDashboardHandoffIntent,
  resolveDashboardOnlyActionSummaryFromPrompt,
} from './ai-provider-dashboard-handoff.util.js';
import { isSummarizeClientPrompt } from './ai-provider-client-context.util.js';
import { isMyStatsPrompt } from './ai-provider-exp-2.util.js';
import { isExplainReassignLimitPrompt } from './ai-provider-dashboard-handoff.util.js';
import { rescueProviderAiIntent } from '../provider-mobile/provider-ai-intent.util.js';

describe('e2e-bug.282: HY call-client FAQ → dashboard handoff (not summarize_client)', () => {
  it.each(E2E282_CALL_HANDOFF_CASES)(
    'detection $id',
    ({
      prompt,
      expectDashboardHandoff,
      expectSummarizeClient,
      expectMyStats,
    }) => {
      expect(isExplainDashboardOnlyActionPrompt(prompt)).toBe(
        expectDashboardHandoff,
      );
      expect(isSummarizeClientPrompt(prompt)).toBe(expectSummarizeClient);
      expect(isMyStatsPrompt(prompt)).toBe(expectMyStats);
      if (expectDashboardHandoff) {
        expect(
          rescueDashboardHandoffIntent(prompt, 'summarize_client'),
        ).toEqual({
          action: 'explain_dashboard_only_action',
          rescueReason: 'explain_dashboard_only_action',
        });
        expect(rescueDashboardHandoffIntent(prompt, 'unknown')).toEqual({
          action: 'explain_dashboard_only_action',
          rescueReason: 'explain_dashboard_only_action',
        });
        const summary = resolveDashboardOnlyActionSummaryFromPrompt(prompt);
        expect(summary).toBeTruthy();
        // e2e-bug.301 — HY/RU may say վահանակ / панель instead of "dashboard".
        expect(summary!).toMatch(/dashboard|վահանակ|панел/i);
      }
    },
  );

  it.each(E2E282_CONTROL_CASES)(
    'control $id',
    ({
      prompt,
      expectDashboardHandoff,
      expectSummarizeClient,
      expectMyStats,
    }) => {
      expect(isExplainDashboardOnlyActionPrompt(prompt)).toBe(
        expectDashboardHandoff,
      );
      expect(isSummarizeClientPrompt(prompt)).toBe(expectSummarizeClient);
      expect(isMyStatsPrompt(prompt)).toBe(expectMyStats);
      if (prompt.includes('վերանշանակել')) {
        expect(isExplainReassignLimitPrompt(prompt)).toBe(true);
      }
    },
  );

  it('why-cant-call helper matches EN/HY/RU', () => {
    expect(
      isWhyCantCallClientDashboardHandoffPrompt(
        'Ինչու չեմ կարող զանգահարել հաճախորդին',
      ),
    ).toBe(true);
    expect(
      isWhyCantCallClientDashboardHandoffPrompt("Why can't I call the client?"),
    ).toBe(true);
    expect(
      isWhyCantCallClientDashboardHandoffPrompt(
        'Почему я не могу позвонить клиенту?',
      ),
    ).toBe(true);
    expect(
      isWhyCantCallClientDashboardHandoffPrompt('Summarize this client'),
    ).toBe(false);
  });

  it('provider rescue steals summarize_client → dashboard handoff for HY call FAQ', () => {
    expect(
      rescueProviderAiIntent(
        'Ինչու չեմ կարող զանգահարել հաճախորդին',
        'summarize_client',
      ),
    ).toBe('explain_dashboard_only_action');
  });
});
