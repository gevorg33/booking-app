export type MarketingAutomationKind = 're_engagement' | 'post_visit_follow_up';

export interface MarketingAutomationSettings {
  /** Send review request after visit completion (existing behavior). */
  postVisitReviewEnabled: boolean;
  /** Automatically email/SMS inactive customers who opted in to marketing. */
  reEngagementEnabled: boolean;
  /** Days since last completed visit before a customer is considered inactive. */
  inactiveDaysThreshold: number;
  reEngagementEmailEnabled: boolean;
  reEngagementSmsEnabled: boolean;
  /** Minimum days between re-engagement messages to the same customer. */
  minDaysBetweenReEngagement: number;
  /** Optional promo code appended to win-back messages. */
  reEngagementPromoCode?: string | null;
}

export const DEFAULT_MARKETING_AUTOMATION_SETTINGS: MarketingAutomationSettings =
  {
    postVisitReviewEnabled: true,
    reEngagementEnabled: false,
    inactiveDaysThreshold: 90,
    reEngagementEmailEnabled: true,
    reEngagementSmsEnabled: false,
    minDaysBetweenReEngagement: 30,
    reEngagementPromoCode: null,
  };

export function mergeMarketingAutomationSettings(
  raw?: Record<string, unknown>,
): MarketingAutomationSettings {
  const partial = (raw ?? {}) as Partial<MarketingAutomationSettings>;
  return {
    ...DEFAULT_MARKETING_AUTOMATION_SETTINGS,
    ...partial,
    inactiveDaysThreshold: Math.max(
      30,
      Math.round(
        partial.inactiveDaysThreshold ??
          DEFAULT_MARKETING_AUTOMATION_SETTINGS.inactiveDaysThreshold,
      ),
    ),
    minDaysBetweenReEngagement: Math.max(
      7,
      Math.round(
        partial.minDaysBetweenReEngagement ??
          DEFAULT_MARKETING_AUTOMATION_SETTINGS.minDaysBetweenReEngagement,
      ),
    ),
    reEngagementPromoCode: partial.reEngagementPromoCode?.trim() || null,
  };
}
