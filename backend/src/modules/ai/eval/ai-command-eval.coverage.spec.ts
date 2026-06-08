import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './ai-command-eval.cases.js';
import {
  ACC_EVAL_CORE_DOMAINS,
  ACC_EVAL_MIN_TOTAL_CASES,
  buildEvalCoverageReport,
  formatEvalCoverageReport,
  inferEvalCaseDomain,
  normalizeEvalCaseTags,
} from './ai-command-eval.coverage.util.js';

describe('ai-command-eval.coverage.util (acc-2.3)', () => {
  it('infers domain from explicit tags and rescued actions', () => {
    expect(
      inferEvalCaseDomain({
        id: 'x',
        prompt: 'mark paid',
        domain: 'payments',
        expect: { rescuedAction: 'mark_paid' },
      }),
    ).toBe('payments');
    expect(
      inferEvalCaseDomain({
        id: 'ai-cmd-gift-track-order',
        prompt: 'Track my physical gift card order',
        expect: { rescuedAction: 'track_physical_gift_card_order' },
      }),
    ).toBe('gift');
  });

  it('normalizeEvalCaseTags fills surface, locale, difficulty, corpus', () => {
    const normalized = normalizeEvalCaseTags({
      id: 'compound-customer_golden_book_package_promo',
      prompt: 'Book spa package and apply promo SPRING25',
      expect: {
        compoundSurface: 'customer',
        compoundSteps: ['book_package', 'promo_code_help'],
      },
    });
    expect(normalized.surface).toBe('customer');
    expect(normalized.locale).toBe('en');
    expect(normalized.difficulty).toBe('hard');
    expect(normalized.corpus).toBe('golden');
    expect(normalized.domain).toBeTruthy();
  });

  it('acc-2.3 — deterministic suite meets 2,000+ labeled cases with balanced domains', () => {
    const report = buildEvalCoverageReport(AI_COMMAND_EVAL_DETERMINISTIC_CASES);
    if (!report.balancePassed) {
      throw new Error(formatEvalCoverageReport(report));
    }
    expect(report.totalCases).toBeGreaterThanOrEqual(ACC_EVAL_MIN_TOTAL_CASES);
    for (const domain of ACC_EVAL_CORE_DOMAINS) {
      expect(report.coreDomainCounts[domain]).toBeGreaterThanOrEqual(180);
    }
  });

  it('every deterministic case has domain, surface, locale, difficulty after normalization', () => {
    for (const evalCase of AI_COMMAND_EVAL_DETERMINISTIC_CASES.map(normalizeEvalCaseTags)) {
      expect(evalCase.domain).toBeTruthy();
      expect(evalCase.surface).toBeTruthy();
      expect(evalCase.locale).toBeTruthy();
      expect(evalCase.difficulty).toBeTruthy();
    }
  });
});
