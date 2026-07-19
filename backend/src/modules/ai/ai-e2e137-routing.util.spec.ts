import { rescueAgentOpsIntent } from './ai-agent-ops.util.js';
import { rescueBusinessTaxIntent } from './ai-business-tax.util.js';
import { rescueSummarizeBookingsIntent } from './ai-dashboard-summarize-bookings.logic.js';
import {
  isCustomerRetentionPrompt,
  isListCustomersPrompt,
  isLookupCustomerPrompt,
} from './ai-dashboard-ops.util.js';
import {
  isOwnerBusinessRevenuePrompt,
  isTotalEarningsPrompt,
} from './dashboard-revenue-analytics.util.js';
import { E2E137_ROUTING_RESCUE_SCENARIOS } from './ai-e2e137-routing.fixtures.js';
import { rescueExplainProfessionalProfileIntent } from './ai-explain-professional-profile.util.js';
import { rescueExplainBusinessHoursAndLocationIntent } from './ai-explain-business-hours-and-location.util.js';
import { rescueListPromoCodesIntent } from './ai-list-promo-codes.util.js';
import { rescueMetaOpsIntent } from './ai-meta-ops.util.js';
import { rescueRetailFinanceIntent } from './ai-retail-finance.util.js';
import { isSummarizeMyRevenuePrompt } from './ai-provider-earnings.util.js';

function rescueE2e137(
  prompt: string,
): { action: string; rescueReason: string } | null {
  return (
    rescueSummarizeBookingsIntent(prompt, 'unknown') ??
    rescueAgentOpsIntent(prompt, 'unknown') ??
    rescueListPromoCodesIntent(prompt, 'unknown') ??
    rescueRetailFinanceIntent(prompt, 'unknown') ??
    (isCustomerRetentionPrompt(prompt)
      ? {
          action: 'summarize_customers',
          rescueReason: 'customer_retention',
        }
      : null) ??
    (isListCustomersPrompt(prompt)
      ? { action: 'list_customers', rescueReason: 'list_customers' }
      : null) ??
    (isLookupCustomerPrompt(prompt)
      ? { action: 'lookup_customer', rescueReason: 'lookup_customer' }
      : null) ??
    rescueBusinessTaxIntent(prompt, 'unknown') ??
    rescueMetaOpsIntent(prompt, 'unknown') ??
    rescueExplainProfessionalProfileIntent(prompt, 'unknown') ??
    rescueExplainBusinessHoursAndLocationIntent(prompt, 'unknown')
  );
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
