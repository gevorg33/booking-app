import { GUEST_PAY_CASH_MANAGE_NEGATIVE_PROMPTS } from './ai-guest-pay-cash-manage-compound.fixtures.js';
import {
  hasGuestPayCashManageCashCue,
  hasGuestPayCashManageGuestCue,
  hasGuestPayCashManageLinkCue,
  isGuestPayCashManageCompoundCandidate,
  isGuestPayCashManagePastBookingPrompt,
} from './ai-guest-pay-cash-manage-cue.util.js';

describe('ai-guest-pay-cash-manage-cue.util (ai-cmd-customer-4.21.6)', () => {
  it('hasGuestPayCashManageGuestCue detects guest booking phrasing', () => {
    expect(
      hasGuestPayCashManageGuestCue(
        'Book as guest, pay at visit, email manage link',
      ),
    ).toBe(true);
    expect(hasGuestPayCashManageGuestCue('Pay cash at visit')).toBe(false);
  });

  it('hasGuestPayCashManageCashCue detects pay-at-visit phrasing', () => {
    expect(
      hasGuestPayCashManageCashCue(
        'Book as guest, pay at visit, email manage link',
      ),
    ).toBe(true);
    expect(
      hasGuestPayCashManageCashCue(
        'Skip online payment and pay at salon instead',
      ),
    ).toBe(false);
  });

  it('hasGuestPayCashManageLinkCue detects manage-link delivery phrasing', () => {
    expect(
      hasGuestPayCashManageLinkCue(
        'Book without an account, pay cash when I arrive, and send me the manage link',
      ),
    ).toBe(true);
    expect(hasGuestPayCashManageLinkCue('Book as guest and pay at visit')).toBe(
      false,
    );
  });

  it('isGuestPayCashManageCompoundCandidate requires all three cues', () => {
    expect(
      isGuestPayCashManageCompoundCandidate(
        'Book as guest, pay at visit, email manage link',
      ),
    ).toBe(true);
    expect(
      isGuestPayCashManageCompoundCandidate(
        'Book as guest and email me the manage link',
      ),
    ).toBe(false);
  });

  it('isGuestPayCashManagePastBookingPrompt excludes already-booked phrasing', () => {
    expect(
      isGuestPayCashManagePastBookingPrompt(
        'I booked as a guest — pay at visit and email me the manage link',
      ),
    ).toBe(true);
  });

  it.each(GUEST_PAY_CASH_MANAGE_NEGATIVE_PROMPTS)(
    'negative prompt $id is not compound candidate',
    ({ prompt }) => {
      expect(isGuestPayCashManageCompoundCandidate(prompt)).toBe(false);
    },
  );
});
