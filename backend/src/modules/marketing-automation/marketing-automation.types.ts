export type MarketingAutomationKind =
  | 're_engagement'
  | 'post_visit_follow_up'
  | 'rebooking_nudge'
  | 'activation_concierge'
  | 'catalog_announcement';

export type MarketingAutomationChannel = 'email' | 'sms' | 'push';

export interface MarketingAutomationSettings {
  /** Send review request after visit completion (existing behavior). */
  postVisitReviewEnabled: boolean;
  /** Automatically email/SMS inactive customers who opted in to marketing. */
  reEngagementEnabled: boolean;
  /** Days since last completed visit before a customer is considered inactive. */
  inactiveDaysThreshold: number;
  reEngagementEmailEnabled: boolean;
  reEngagementSmsEnabled: boolean;
  /** Consumer push for lapsed-customer win-back (adopt-4.5). */
  reEngagementPushEnabled: boolean;
  /** Minimum days between re-engagement messages to the same customer. */
  minDaysBetweenReEngagement: number;
  /** Optional promo code appended to win-back messages. */
  reEngagementPromoCode?: string | null;
  /** Optional loyalty bonus ($) credited when a win-back message is sent. */
  reEngagementLoyaltyBonusPoints?: number | null;
  /** Cadence-based "time for your next appointment" nudges (adopt-4.4). */
  rebookingNudgeEnabled: boolean;
  /** Default days between visits when a service has no cadence override. */
  defaultRebookingCadenceDays: number;
  rebookingNudgeEmailEnabled: boolean;
  rebookingNudgeSmsEnabled: boolean;
  rebookingNudgePushEnabled: boolean;
  /** Minimum days between rebooking nudges for the same customer + service. */
  minDaysBetweenRebookingNudges: number;
  /** Optional promo code appended to rebooking nudge messages. */
  rebookingNudgePromoCode?: string | null;
  /** n99-3.5 — one-tap resume nudges at 24h / 72h for unactivated qualified installs. */
  activationConciergeEnabled: boolean;
  activationConciergeEmailEnabled: boolean;
  activationConciergePushEnabled: boolean;
}

export const DEFAULT_MARKETING_AUTOMATION_SETTINGS: MarketingAutomationSettings =
  {
    postVisitReviewEnabled: true,
    reEngagementEnabled: false,
    inactiveDaysThreshold: 90,
    reEngagementEmailEnabled: true,
    reEngagementSmsEnabled: false,
    reEngagementPushEnabled: true,
    minDaysBetweenReEngagement: 30,
    reEngagementPromoCode: null,
    reEngagementLoyaltyBonusPoints: null,
    rebookingNudgeEnabled: false,
    defaultRebookingCadenceDays: 42,
    rebookingNudgeEmailEnabled: true,
    rebookingNudgeSmsEnabled: false,
    rebookingNudgePushEnabled: true,
    minDaysBetweenRebookingNudges: 14,
    rebookingNudgePromoCode: null,
    activationConciergeEnabled: true,
    activationConciergeEmailEnabled: true,
    activationConciergePushEnabled: true,
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
    reEngagementLoyaltyBonusPoints: (() => {
      const raw = partial.reEngagementLoyaltyBonusPoints;
      if (raw == null) {
        return DEFAULT_MARKETING_AUTOMATION_SETTINGS.reEngagementLoyaltyBonusPoints;
      }
      if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) {
        return null;
      }
      return Math.max(1, Math.min(500, Math.round(raw)));
    })(),
    defaultRebookingCadenceDays: Math.max(
      7,
      Math.min(
        365,
        Math.round(
          partial.defaultRebookingCadenceDays ??
            DEFAULT_MARKETING_AUTOMATION_SETTINGS.defaultRebookingCadenceDays,
        ),
      ),
    ),
    minDaysBetweenRebookingNudges: Math.max(
      7,
      Math.round(
        partial.minDaysBetweenRebookingNudges ??
          DEFAULT_MARKETING_AUTOMATION_SETTINGS.minDaysBetweenRebookingNudges,
      ),
    ),
    reEngagementPromoCode: partial.reEngagementPromoCode?.trim() || null,
    rebookingNudgePromoCode: partial.rebookingNudgePromoCode?.trim() || null,
  };
}
