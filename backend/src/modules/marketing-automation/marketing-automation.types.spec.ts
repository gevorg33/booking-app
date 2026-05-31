import {
  DEFAULT_MARKETING_AUTOMATION_SETTINGS,
  mergeMarketingAutomationSettings,
} from './marketing-automation.types.js';

describe('marketing-automation.types', () => {
  it('returns defaults when settings are missing', () => {
    expect(mergeMarketingAutomationSettings(undefined)).toEqual(DEFAULT_MARKETING_AUTOMATION_SETTINGS);
    expect(mergeMarketingAutomationSettings({})).toEqual(DEFAULT_MARKETING_AUTOMATION_SETTINGS);
  });

  it('merges partial settings', () => {
    expect(
      mergeMarketingAutomationSettings({
        reEngagementEnabled: true,
        postVisitReviewEnabled: false,
      }),
    ).toMatchObject({
      reEngagementEnabled: true,
      postVisitReviewEnabled: false,
      inactiveDaysThreshold: 90,
    });
  });

  it('clamps inactive and cooldown thresholds', () => {
    expect(
      mergeMarketingAutomationSettings({
        inactiveDaysThreshold: 10,
        minDaysBetweenReEngagement: 2,
      }),
    ).toMatchObject({
      inactiveDaysThreshold: 30,
      minDaysBetweenReEngagement: 7,
    });
  });

  it('normalizes promo code whitespace', () => {
    expect(mergeMarketingAutomationSettings({ reEngagementPromoCode: '  WIN10  ' })).toMatchObject({
      reEngagementPromoCode: 'WIN10',
    });
    expect(mergeMarketingAutomationSettings({ reEngagementPromoCode: '   ' })).toMatchObject({
      reEngagementPromoCode: null,
    });
  });
});
