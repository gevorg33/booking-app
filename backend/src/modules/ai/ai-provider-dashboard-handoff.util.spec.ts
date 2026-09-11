import { describe, expect, it } from '@jest/globals';
import {
  PROVIDER_EXPLAIN_DASHBOARD_ONLY_ACTION_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_REASSIGN_LIMIT_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_TIME_OFF_APPROVAL_PROMPT_SCENARIOS,
} from './ai-provider-dashboard-handoff.fixtures.js';
import {
  buildExplainReassignLimitSummary,
  buildExplainTimeOffApprovalSummary,
  isExplainDashboardOnlyActionPrompt,
  isExplainReassignLimitPrompt,
  isExplainTimeOffApprovalPrompt,
  rescueDashboardHandoffIntent,
  resolveDashboardOnlyActionSummaryFromPrompt,
} from './ai-provider-dashboard-handoff.util.js';
import { isIntentAllowedOnSurface } from './ai-command-registry.util.js';
import {
  isMyStatsPrompt,
  isReassignBookingSameDayPrompt,
} from './ai-provider-exp-2.util.js';
import { isListMyTimeOffRequestsPrompt } from './ai-provider-time-off.util.js';
import { isExplainClientIntakePrompt } from './ai-provider-client-context.util.js';
import { rescueProviderAiIntent } from '../provider-mobile/provider-ai-intent.util.js';

describe('ai-provider-dashboard-handoff.util (e2e-bug.247 / ai-cmd-provider-5.25.1–5.25.3)', () => {
  it('registers all three explainers on provider surface', () => {
    expect(
      isIntentAllowedOnSurface('explain_dashboard_only_action', 'provider'),
    ).toBe(true);
    expect(isIntentAllowedOnSurface('explain_reassign_limit', 'provider')).toBe(
      true,
    );
    expect(
      isIntentAllowedOnSurface('explain_time_off_approval', 'provider'),
    ).toBe(true);
  });

  it.each(
    PROVIDER_EXPLAIN_DASHBOARD_ONLY_ACTION_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('detects dashboard-only explainer %s', (_id, prompt) => {
    expect(isExplainDashboardOnlyActionPrompt(prompt as string)).toBe(true);
    expect(isExplainReassignLimitPrompt(prompt as string)).toBe(false);
    expect(isExplainTimeOffApprovalPrompt(prompt as string)).toBe(false);
  });

  it.each(
    PROVIDER_EXPLAIN_REASSIGN_LIMIT_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('detects reassign-limit explainer %s', (_id, prompt) => {
    expect(isExplainReassignLimitPrompt(prompt as string)).toBe(true);
    expect(isReassignBookingSameDayPrompt(prompt as string)).toBe(false);
  });

  it.each(
    PROVIDER_EXPLAIN_TIME_OFF_APPROVAL_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('detects time-off-approval explainer %s', (_id, prompt) => {
    expect(isExplainTimeOffApprovalPrompt(prompt as string)).toBe(true);
    expect(isListMyTimeOffRequestsPrompt(prompt as string)).toBe(false);
  });

  it.each(
    PROVIDER_EXPLAIN_DASHBOARD_ONLY_ACTION_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('rescues %s to explain_dashboard_only_action', (_id, prompt) => {
    expect(rescueDashboardHandoffIntent(prompt as string, 'unknown')).toEqual({
      action: 'explain_dashboard_only_action',
      rescueReason: 'explain_dashboard_only_action',
    });
  });

  it.each(
    PROVIDER_EXPLAIN_REASSIGN_LIMIT_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('rescues %s to explain_reassign_limit', (_id, prompt) => {
    expect(rescueDashboardHandoffIntent(prompt as string, 'unknown')).toEqual({
      action: 'explain_reassign_limit',
      rescueReason: 'explain_reassign_limit',
    });
  });

  it.each(
    PROVIDER_EXPLAIN_TIME_OFF_APPROVAL_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('rescues %s to explain_time_off_approval', (_id, prompt) => {
    expect(rescueDashboardHandoffIntent(prompt as string, 'unknown')).toEqual({
      action: 'explain_time_off_approval',
      rescueReason: 'explain_time_off_approval',
    });
  });

  it('prefers explain_time_off_approval over dashboard-only for who-approves', () => {
    expect(
      rescueDashboardHandoffIntent('Who approves my time off?', 'unknown')
        ?.action,
    ).toBe('explain_time_off_approval');
  });

  it.each([
    ['reassign-live', 'Reassign Jane to Sam today'],
    ['time-off-list', 'Show my time off requests'],
    ['request-time-off', 'Request time off next Friday'],
    ['a11y', 'Bigger text in app?'],
  ])('rejects negative %s', (_id, prompt) => {
    expect(isExplainDashboardOnlyActionPrompt(prompt)).toBe(false);
    expect(isExplainReassignLimitPrompt(prompt)).toBe(false);
    expect(isExplainTimeOffApprovalPrompt(prompt)).toBe(false);
    expect(rescueDashboardHandoffIntent(prompt, 'unknown')).toBeNull();
  });

  it('builds topic-specific and static summaries', () => {
    const loyalty = resolveDashboardOnlyActionSummaryFromPrompt(
      'Adjust loyalty points',
    );
    expect(loyalty).toBeTruthy();
    expect(loyalty!.toLowerCase()).toContain('dashboard');
    expect(buildExplainReassignLimitSummary().toLowerCase()).toContain(
      'reassign',
    );
    expect(buildExplainTimeOffApprovalSummary().toLowerCase()).toContain(
      'manager',
    );
  });

  it('does not let client-intake / my_stats steal handoff FAQ prompts', () => {
    expect(isExplainClientIntakePrompt('Open the full intake answers')).toBe(
      false,
    );
    expect(
      isMyStatsPrompt(
        'Ինչու չեմ կարող վերանշանակել բազմածառայության ամրագրումը',
      ),
    ).toBe(false);
    expect(
      rescueProviderAiIntent(
        'Open the full intake answers',
        'explain_client_intake',
      ),
    ).toBe('explain_dashboard_only_action');
    expect(
      rescueProviderAiIntent(
        'Ինչու չեմ կարող վերանշանակել բազմածառայության ամրագրումը',
        'my_stats',
      ),
    ).toBe('explain_reassign_limit');
  });
});
