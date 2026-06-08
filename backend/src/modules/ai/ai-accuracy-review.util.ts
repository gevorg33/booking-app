import type {
  AiAccuracyAnalyticsSummary,
  AiConfusionMatrixEntry,
  AiWorstPromptEntry,
} from './ai-platform.util.js';
import {
  ACCURACY_REVIEW_CONFUSION_TOP_N,
  ACCURACY_REVIEW_LOCALE_GAP_ALERT,
  ACCURACY_REVIEW_SCENARIOS,
  ACCURACY_REVIEW_WORST_PROMPTS_TOP_N,
} from './ai-accuracy-review.fixtures.js';
import { computeLocaleAccuracySpread } from './ai-accuracy-exit-gate.util.js';
import { computeEscalationAnalytics } from './ai-escalation-analytics.util.js';
import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';

export {
  ACCURACY_REVIEW_CONFUSION_TOP_N,
  ACCURACY_REVIEW_LOCALE_GAP_ALERT,
  ACCURACY_REVIEW_SCENARIOS,
  ACCURACY_REVIEW_WORST_PROMPTS_TOP_N,
} from './ai-accuracy-review.fixtures.js';

export interface AccuracyReviewDigest {
  generatedAt: string;
  periodDays: number;
  businessId?: string;
  headline: {
    totalCommands: number;
    noClarifyCompletionRate: number;
    accurateRate: number;
    misclassificationRate: number;
    escalationRate: number;
    impliedAccuracy: number;
    escalationMeetsTarget: boolean;
    weeklyAccuracyDelta?: number;
  };
  regressions: string[];
  newFailures: AiWorstPromptEntry[];
  topConfusedIntents: AiConfusionMatrixEntry[];
  localesBelowTarget: Array<{
    locale: string;
    accuracy: number;
    total: number;
    gapFromBest: number;
  }>;
  escalationSummary: ReturnType<typeof computeEscalationAnalytics>;
  recommendedActions: string[];
}

function computeAccurateRate(analytics: AiAccuracyAnalyticsSummary): number {
  if (!analytics.totalCommands) return 0;
  const accurate = Object.values(analytics.byIntent).reduce(
    (sum, stats) => sum + stats.accurate,
    0,
  );
  return accurate / analytics.totalCommands;
}

/** Split a 2×period window into current and immediately prior periods. */
export function splitTraceRowsByPeriod(
  rows: AiTraceAnalyticsRow[],
  periodDays: number,
): { current: AiTraceAnalyticsRow[]; previous: AiTraceAnalyticsRow[] } {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - periodDays);
  const cutoffMs = cutoff.getTime();
  const current: AiTraceAnalyticsRow[] = [];
  const previous: AiTraceAnalyticsRow[] = [];
  for (const row of rows) {
    const createdMs = new Date(row.createdAt).getTime();
    if (createdMs >= cutoffMs) current.push(row);
    else previous.push(row);
  }
  return { current, previous };
}

/** acc-6.1 — worst prompts seen this period but not in the prior period. */
export function filterNewFailuresSincePriorPeriod(
  currentWorst: AiWorstPromptEntry[],
  previousWorst: AiWorstPromptEntry[],
): AiWorstPromptEntry[] {
  const priorHashes = new Set(previousWorst.map((entry) => entry.promptHash));
  return currentWorst.filter((entry) => !priorHashes.has(entry.promptHash));
}

export function findLocalesBelowTarget(
  byLocale: AiAccuracyAnalyticsSummary['byLocale'],
  spreadAlert = ACCURACY_REVIEW_LOCALE_GAP_ALERT,
): AccuracyReviewDigest['localesBelowTarget'] {
  const entries = Object.entries(byLocale)
    .filter(([, stats]) => stats.total >= 5)
    .map(([locale, stats]) => ({
      locale,
      total: stats.total,
      accuracy: stats.total ? stats.accurate / stats.total : 0,
    }));
  if (entries.length === 0) return [];

  const best = Math.max(...entries.map((entry) => entry.accuracy));
  return entries
    .map((entry) => ({
      ...entry,
      gapFromBest: best - entry.accuracy,
    }))
    .filter((entry) => entry.gapFromBest >= spreadAlert)
    .sort((a, b) => b.gapFromBest - a.gapFromBest);
}

/** acc-6.1 — compile weekly accuracy review for dashboard/email. */
export function buildWeeklyAccuracyReviewDigest(input: {
  analytics: AiAccuracyAnalyticsSummary;
  rows: AiTraceAnalyticsRow[];
  previousAnalytics?: AiAccuracyAnalyticsSummary;
  previousWorstPrompts?: AiWorstPromptEntry[];
  businessId?: string;
}): AccuracyReviewDigest {
  const accurateRate = computeAccurateRate(input.analytics);
  const previousAccurate = input.previousAnalytics
    ? computeAccurateRate(input.previousAnalytics)
    : undefined;
  const escalationSummary = computeEscalationAnalytics(input.rows);
  const localesBelowTarget = findLocalesBelowTarget(input.analytics.byLocale);
  const topConfusedIntents = [...(input.analytics.confusionMatrix ?? [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, ACCURACY_REVIEW_CONFUSION_TOP_N);
  const currentWorst = (input.analytics.worstPrompts ?? []).slice(
    0,
    ACCURACY_REVIEW_WORST_PROMPTS_TOP_N,
  );
  const newFailures = input.previousWorstPrompts
    ? filterNewFailuresSincePriorPeriod(currentWorst, input.previousWorstPrompts)
    : currentWorst;

  const regressions: string[] = [];
  if (
    typeof previousAccurate === 'number' &&
    accurateRate + 1e-9 < previousAccurate - 0.02
  ) {
    regressions.push(
      `Accuracy dropped ${((previousAccurate - accurateRate) * 100).toFixed(1)} pts vs prior period`,
    );
  }
  if (input.analytics.accuracySlo?.alert) {
    regressions.push('7-day accuracy delta exceeded alert threshold');
  }
  if (!escalationSummary.meetsTarget) {
    regressions.push(
      `Escalation rate ${(escalationSummary.escalationRate * 100).toFixed(2)}% above ${(escalationSummary.targetRate * 100).toFixed(0)}% target`,
    );
  }

  const recommendedActions: string[] = [];
  if (newFailures.length > 0) {
    recommendedActions.push(
      `Triage ${newFailures.length} worst prompt(s) in the labeling queue`,
    );
  }
  if (topConfusedIntents.length > 0) {
    recommendedActions.push(
      `Review top confused pair ${topConfusedIntents[0].from} → ${topConfusedIntents[0].to}`,
    );
  }
  for (const locale of localesBelowTarget.slice(0, 2)) {
    recommendedActions.push(
      `Add HY/RU eval coverage for locale ${locale.locale} (${(locale.accuracy * 100).toFixed(0)}% accurate)`,
    );
  }
  if (escalationSummary.escalationCount > 0) {
    recommendedActions.push('Review human handoffs for new eval cases');
  }

  return {
    generatedAt: new Date().toISOString(),
    periodDays: input.analytics.periodDays,
    businessId: input.businessId,
    headline: {
      totalCommands: input.analytics.totalCommands,
      noClarifyCompletionRate: input.analytics.noClarifyCompletionRate,
      accurateRate,
      misclassificationRate: input.analytics.misclassificationRate,
      escalationRate: escalationSummary.escalationRate,
      impliedAccuracy: escalationSummary.impliedAccuracy,
      escalationMeetsTarget: escalationSummary.meetsTarget,
      weeklyAccuracyDelta: input.analytics.accuracySlo?.weeklyDelta,
    },
    regressions,
    newFailures,
    topConfusedIntents,
    localesBelowTarget,
    escalationSummary,
    recommendedActions,
  };
}

function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatAccuracyReviewDigestSummary(
  digest: AccuracyReviewDigest,
): string {
  const lines = [
    `Weekly accuracy review (${digest.periodDays}d)`,
    `Commands: ${digest.headline.totalCommands}`,
    `No-clarify: ${pct(digest.headline.noClarifyCompletionRate)}`,
    `Accurate: ${pct(digest.headline.accurateRate)}`,
    `Escalations: ${pct(digest.headline.escalationRate, 2)} (target < ${pct(digest.escalationSummary.targetRate, 0)})`,
    `Implied accuracy (1 − escalation): ${pct(digest.headline.impliedAccuracy)}`,
  ];
  if (digest.regressions.length) {
    lines.push('', 'Regressions:', ...digest.regressions.map((row) => `• ${row}`));
  }
  if (digest.newFailures.length) {
    lines.push(
      '',
      'New failures:',
      ...digest.newFailures.slice(0, 5).map(
        (row) =>
          `• ${row.promptSnippet.slice(0, 80)} (${row.action}, ${row.failureCount}×)`,
      ),
    );
  }
  if (digest.topConfusedIntents.length) {
    lines.push(
      '',
      'Top confused intents:',
      ...digest.topConfusedIntents.slice(0, 3).map(
        (row) => `• ${row.from} → ${row.to} (${row.count}×)`,
      ),
    );
  }
  if (digest.localesBelowTarget.length) {
    lines.push(
      '',
      'Locales below target:',
      ...digest.localesBelowTarget.slice(0, 3).map(
        (row) =>
          `• ${row.locale}: ${pct(row.accuracy)} (${row.gapFromBest * 100} pts behind best)`,
      ),
    );
  }
  if (digest.escalationSummary.recentEscalations.length) {
    lines.push(
      '',
      'Recent escalations (triage for eval):',
      ...digest.escalationSummary.recentEscalations.slice(0, 5).map(
        (row) =>
          `• ${row.promptSnippet.slice(0, 80)} (${row.action}, ${row.surface}, ${row.locale})`,
      ),
    );
  }
  if (digest.recommendedActions.length) {
    lines.push('', 'Actions:', ...digest.recommendedActions.map((row) => `• ${row}`));
  }
  return lines.join('\n');
}

/** acc-6.1 — HTML body for owner email digest. */
export function formatAccuracyReviewDigestEmailHtml(
  digest: AccuracyReviewDigest,
  businessName: string,
): string {
  const section = (title: string, items: string[]) =>
    items.length
      ? `<h3 style="margin:16px 0 8px;font-size:14px;">${title}</h3><ul style="margin:0;padding-left:20px;">${items
          .map((item) => `<li style="margin:4px 0;">${item}</li>`)
          .join('')}</ul>`
      : '';

  const regressions = digest.regressions.map((row) => row);
  const newFailures = digest.newFailures.slice(0, 8).map(
    (row) =>
      `${escapeHtml(row.promptSnippet.slice(0, 100))} — <code>${escapeHtml(row.action)}</code> (${row.failureCount}×)`,
  );
  const confused = digest.topConfusedIntents.slice(0, 5).map(
    (row) =>
      `<code>${escapeHtml(row.from)}</code> → <code>${escapeHtml(row.to)}</code> (${row.count}×)`,
  );
  const locales = digest.localesBelowTarget.slice(0, 5).map(
    (row) =>
      `${escapeHtml(row.locale)}: ${pct(row.accuracy)} (${(row.gapFromBest * 100).toFixed(1)} pts behind best)`,
  );
  const escalations = digest.escalationSummary.recentEscalations.slice(0, 8).map(
    (row) =>
      `${escapeHtml(row.promptSnippet.slice(0, 100))} — <code>${escapeHtml(row.action)}</code> (${escapeHtml(row.surface)}, ${escapeHtml(row.locale)})`,
  );
  const actions = digest.recommendedActions.map((row) => escapeHtml(row));

  return `<div style="font-family:sans-serif;color:#111;max-width:640px;">
<p>Weekly AI accuracy review for <strong>${escapeHtml(businessName)}</strong> (${digest.periodDays}-day window).</p>
<table style="border-collapse:collapse;margin:12px 0;">
<tr><td style="padding:4px 12px 4px 0;color:#666;">Commands</td><td><strong>${digest.headline.totalCommands}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666;">Accurate</td><td><strong>${pct(digest.headline.accurateRate)}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666;">Escalations</td><td><strong>${pct(digest.headline.escalationRate, 2)}</strong> (target &lt; ${pct(digest.escalationSummary.targetRate, 0)})</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#666;">Implied accuracy</td><td><strong>${pct(digest.headline.impliedAccuracy)}</strong></td></tr>
</table>
${section('Regressions', regressions)}
${section('New failures', newFailures)}
${section('Recent escalations', escalations)}
${section('Top confused intents', confused)}
${section('Locales below target', locales)}
${section('Recommended actions', actions)}
<p style="margin-top:24px;font-size:12px;color:#666;">Open AI Ops in your dashboard for the full review.</p>
</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
