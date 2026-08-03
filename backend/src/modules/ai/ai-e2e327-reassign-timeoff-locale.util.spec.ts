import { describe, expect, it } from '@jest/globals';
import {
  E2E327_REASSIGN_LIMIT_CASES,
  E2E327_TIME_OFF_APPROVAL_CASES,
} from './ai-e2e327-reassign-timeoff-locale.fixtures.js';
import {
  buildExplainReassignLimitSummary,
  buildExplainTimeOffApprovalSummary,
  isExplainReassignLimitPrompt,
  isExplainTimeOffApprovalPrompt,
} from './ai-provider-dashboard-handoff.util.js';

describe('e2e-bug.327: explain_reassign_limit / explain_time_off_approval localize under HY/RU', () => {
  it.each(E2E327_REASSIGN_LIMIT_CASES)(
    '$id localizes buildExplainReassignLimitSummary',
    ({ prompt, locale, expectFragment, forbidEnglishFragments }) => {
      expect(isExplainReassignLimitPrompt(prompt)).toBe(true);
      const summary = buildExplainReassignLimitSummary(locale, prompt);
      expect(summary).toContain(expectFragment);
      for (const forbidden of forbidEnglishFragments ?? []) {
        expect(summary).not.toContain(forbidden);
      }
    },
  );

  it.each(E2E327_TIME_OFF_APPROVAL_CASES)(
    '$id localizes buildExplainTimeOffApprovalSummary',
    ({ prompt, locale, expectFragment, forbidEnglishFragments }) => {
      expect(isExplainTimeOffApprovalPrompt(prompt)).toBe(true);
      const summary = buildExplainTimeOffApprovalSummary(locale, prompt);
      expect(summary).toContain(expectFragment);
      for (const forbidden of forbidEnglishFragments ?? []) {
        expect(summary).not.toContain(forbidden);
      }
    },
  );

  it('EN regression guard: default (no locale, no prompt) stays English', () => {
    expect(buildExplainReassignLimitSummary().toLowerCase()).toContain('reassign');
    expect(buildExplainTimeOffApprovalSummary().toLowerCase()).toContain('manager');
    expect(buildExplainReassignLimitSummary()).not.toMatch(/[԰-֏]|[Ѐ-ӿ]/);
    expect(buildExplainTimeOffApprovalSummary()).not.toMatch(/[԰-֏]|[Ѐ-ӿ]/);
  });
});
