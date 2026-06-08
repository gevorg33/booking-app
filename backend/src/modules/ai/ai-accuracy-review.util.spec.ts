import {
  buildWeeklyAccuracyReviewDigest,
  filterNewFailuresSincePriorPeriod,
  findLocalesBelowTarget,
  formatAccuracyReviewDigestEmailHtml,
  formatAccuracyReviewDigestSummary,
  splitTraceRowsByPeriod,
} from './ai-accuracy-review.util.js';
import type { AiWorstPromptEntry } from './ai-platform.util.js';

const worst = (
  hash: string,
  snippet: string,
  overrides: Partial<AiWorstPromptEntry> = {},
): AiWorstPromptEntry => ({
  rank: 1,
  promptHash: hash,
  promptSnippet: snippet,
  action: 'create_booking',
  surface: 'dashboard',
  locale: 'en',
  failureCount: 2,
  avgConfidence: 0.4,
  failureSignals: {
    suspected_miss: 0,
    wrong_execution: 0,
    clarify_abandoned: 0,
    thumbs_down: 0,
    failed_outcome: 0,
    low_confidence: 0,
    human_escalation: 0,
  },
  correctedAction: null,
  lastSeenAt: new Date().toISOString(),
  ...overrides,
});

describe('ai-accuracy-review.util (acc-6.1)', () => {
  const baseAnalytics = {
    periodDays: 7,
    totalCommands: 120,
    noClarifyCompletionRate: 0.88,
    clarifyRate: 0.1,
    clarifySuccessRate: 0.9,
    clarifyQualityTarget: 0.9,
    clarifyQualityMeetsTarget: true,
    clarifyNextTurnSampleSize: 10,
    clarifyNextTurnSuccessCount: 9,
    clarifyAbandonRate: 0.05,
    misclassificationRate: 0.04,
    explicitNegativeRate: 0.02,
    byIntent: { create_booking: { total: 50, accurate: 45, clarify: 3, failures: 2 } },
    byLocale: {
      en: { total: 80, accurate: 72 },
      hy: { total: 40, accurate: 28 },
    },
    bySurface: { dashboard: { total: 120, accurate: 100 } },
    confusionMatrix: [
      { from: 'list_bookings', to: 'show_appointments', count: 3, share: 0.1, retryCount: 2, undoCount: 1 },
    ],
    worstPrompts: [worst('a', 'book anna tomorrow')],
    worstClarifies: [],
    accuracySlo: {
      periodDays: 7,
      target: 0.99,
      rolling7DayAccuracy: 0.9,
      previous7DayAccuracy: 0.88,
      weeklyDelta: 0.02,
      gapToTarget: -0.09,
      meetsTarget: false,
      alert: false,
      rolling7CommandCount: 120,
      trend: [],
    },
  };

  it('buildWeeklyAccuracyReviewDigest compiles review sections', () => {
    const digest = buildWeeklyAccuracyReviewDigest({
      analytics: baseAnalytics,
      rows: [],
    });

    expect(digest.recommendedActions.length).toBeGreaterThan(0);
    expect(digest.localesBelowTarget.length).toBeGreaterThan(0);
    expect(digest.headline.totalCommands).toBe(120);
  });

  it('findLocalesBelowTarget flags spread below best locale', () => {
    const alerts = findLocalesBelowTarget(baseAnalytics.byLocale);
    expect(alerts.some((row) => row.locale === 'hy')).toBe(true);
  });

  it('filterNewFailuresSincePriorPeriod keeps only unseen prompt hashes', () => {
    const current = [worst('new-1', 'new prompt'), worst('old-1', 'old prompt')];
    const previous = [worst('old-1', 'old prompt')];
    const filtered = filterNewFailuresSincePriorPeriod(current, previous);
    expect(filtered.map((row) => row.promptHash)).toEqual(['new-1']);
  });

  it('splitTraceRowsByPeriod splits a 14-day window', () => {
    const now = new Date();
    const eightDaysAgo = new Date(now);
    eightDaysAgo.setUTCDate(eightDaysAgo.getUTCDate() - 8);
    const rows = [
      { createdAt: now } as any,
      { createdAt: eightDaysAgo } as any,
    ];
    const { current, previous } = splitTraceRowsByPeriod(rows, 7);
    expect(current).toHaveLength(1);
    expect(previous).toHaveLength(1);
  });

  it('formatAccuracyReviewDigestSummary includes new failures and confused pairs', () => {
    const digest = buildWeeklyAccuracyReviewDigest({
      analytics: baseAnalytics,
      rows: [],
      previousWorstPrompts: [],
    });
    const text = formatAccuracyReviewDigestSummary(digest);
    expect(text).toContain('New failures');
    expect(text).toContain('Top confused intents');
    expect(text).toContain('Implied accuracy');
  });

  it('formatAccuracyReviewDigestSummary lists recent escalations for triage', () => {
    const digest = buildWeeklyAccuracyReviewDigest({
      analytics: baseAnalytics,
      rows: [
        {
          traceId: 'esc-1',
          surface: 'dashboard',
          locale: 'en',
          action: 'request_human_help',
          outcome: 'executed',
          confidence: null,
          failureSignal: 'human_escalation',
          feedbackRating: null,
          correctedAction: null,
          rawPrompt: 'I need a person to help me cancel',
          createdAt: new Date(),
        } as any,
      ],
    });
    const text = formatAccuracyReviewDigestSummary(digest);
    expect(text).toContain('Recent escalations');
    expect(text).toContain('request_human_help');
  });

  it('formatAccuracyReviewDigestEmailHtml escapes HTML in snippets', () => {
    const digest = buildWeeklyAccuracyReviewDigest({
      analytics: {
        ...baseAnalytics,
        worstPrompts: [worst('x', '<script>alert(1)</script>')],
      },
      rows: [],
    });
    const html = formatAccuracyReviewDigestEmailHtml(digest, 'Salon & Spa');
    expect(html).toContain('Salon &amp; Spa');
    expect(html).not.toContain('<script>');
  });
});
