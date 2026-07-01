import {
  hasSubscriptionFirstVisitBookCue,
  hasSubscriptionFirstVisitMembershipCue,
} from './ai-subscription-first-visit-cue.util.js';

describe('ai-subscription-first-visit-cue.util (ai-cmd-customer-4.21.4)', () => {
  it('hasSubscriptionFirstVisitMembershipCue detects membership apply phrasing', () => {
    expect(
      hasSubscriptionFirstVisitMembershipCue(
        "Use my membership for today's massage",
      ),
    ).toBe(true);
    expect(
      hasSubscriptionFirstVisitMembershipCue('Use subscription credit'),
    ).toBe(false);
    expect(
      hasSubscriptionFirstVisitMembershipCue(
        "Book today's facial with my subscription",
      ),
    ).toBe(true);
    expect(
      hasSubscriptionFirstVisitMembershipCue(
        'Subscribe and save vs one-time for massage',
      ),
    ).toBe(false);
  });

  it('hasSubscriptionFirstVisitBookCue detects service and date cues', () => {
    expect(
      hasSubscriptionFirstVisitBookCue("Use my membership for today's massage"),
    ).toBe(true);
    expect(hasSubscriptionFirstVisitBookCue('Use subscription credit')).toBe(
      false,
    );
    expect(
      hasSubscriptionFirstVisitBookCue('Redeem a membership visit for facial'),
    ).toBe(true);
    expect(
      hasSubscriptionFirstVisitBookCue(
        "Book today's facial with my subscription",
      ),
    ).toBe(true);
    expect(
      hasSubscriptionFirstVisitBookCue(
        'Apply my membership to book manicure today',
      ),
    ).toBe(true);
    expect(
      hasSubscriptionFirstVisitBookCue(
        "Use my membership for tomorrow's blowdry",
      ),
    ).toBe(true);
    expect(hasSubscriptionFirstVisitBookCue('Book haircut with my plan')).toBe(
      true,
    );
    expect(
      hasSubscriptionFirstVisitBookCue('Schedule manicure with my membership'),
    ).toBe(true);
    expect(hasSubscriptionFirstVisitBookCue('Use my membership only')).toBe(
      false,
    );
    expect(hasSubscriptionFirstVisitBookCue('Book with my subscription')).toBe(
      false,
    );
  });

  it('hasSubscriptionFirstVisitMembershipCue accepts pay-with-plan phrasing', () => {
    expect(
      hasSubscriptionFirstVisitMembershipCue('Pay with my plan for haircut'),
    ).toBe(true);
  });
});
