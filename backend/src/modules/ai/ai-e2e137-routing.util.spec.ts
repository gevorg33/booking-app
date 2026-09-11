/**
 * e2e-bug.458 (§172) — this spec used to assert against a private reimplementation
 * of the rescue chain: a hand-written `??` cascade of the individual predicates,
 * standing in for `AiIntentRescueService`. It therefore agreed with itself by
 * construction and could not see the service diverge.
 *
 * It proved the point the hard way. The service gained a second, earlier-running
 * retention producer on 2026-08-02 (`customer_retention_rate`, via the metric
 * resolvers) that shadows the older `customer_retention` branch, and this spec
 * stayed green throughout because its copy still had the old branch. When §171
 * corrected the fixtures to match reality, the copy went red instead — a test
 * failing because the code was fixed is the signature of a mirror.
 *
 * It now drives the real service. The remaining divergence is
 * `professional-profile`, which is a genuine open question about that command's
 * surfaces rather than a routing bug (`e2e-bug.456`).
 */
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { rescueBusinessTaxIntent } from './ai-business-tax.util.js';
import {
  isOwnerBusinessRevenuePrompt,
  isTotalEarningsPrompt,
} from './dashboard-revenue-analytics.util.js';
import { E2E137_ROUTING_RESCUE_SCENARIOS } from './ai-e2e137-routing.fixtures.js';
import { isSummarizeMyRevenuePrompt } from './ai-provider-earnings.util.js';

function rescueE2e137(
  prompt: string,
): { action: string; rescueReason: string } | null {
  const rescued = new AiIntentRescueService().rescue({
    prompt,
    action: 'unknown',
    params: {},
    employees: [],
    surface: 'dashboard',
  } as never) as { action: string; rescueReason: string } | null;
  return rescued ?? null;
}

describe('e2e-bug.137 — react_agent domain routing rescues', () => {
  it.each(E2E137_ROUTING_RESCUE_SCENARIOS)(
    'rescues $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason }) => {
      const rescued = rescueE2e137(prompt);
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);
    },
  );

  it('treats owner "have I made" revenue as business total, not provider my-revenue', () => {
    const prompt = 'How much revenue have I made this month?';
    expect(isSummarizeMyRevenuePrompt(prompt)).toBe(false);
    expect(isOwnerBusinessRevenuePrompt(prompt)).toBe(true);
    expect(isTotalEarningsPrompt(prompt)).toBe(true);
  });

  it('does not steal sales tax rate into total earnings', () => {
    const prompt = "What's my sales tax rate configured to?";
    expect(isTotalEarningsPrompt(prompt)).toBe(false);
    expect(rescueBusinessTaxIntent(prompt, 'unknown')?.action).toBe(
      'explain_business_tax',
    );
  });
});
