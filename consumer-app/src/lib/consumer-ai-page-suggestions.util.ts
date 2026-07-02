import type { ConsumerCopy } from './consumer-copy.types.js';

/** ai-cmd-customer-4.9.1 — contextual assistant chips per consumer route. */
export type ConsumerPageSuggestionId =
  | 'book'
  | 'manage-booking'
  | 'manage-booking-guest'
  | 'account'
  | 'salon-home'
  | 'multi-service-picker'
  | 'gift-card-checkout'
  | 'multi-service-checkout'
  | 'package-confirm'
  | 'lab-to-book'
  | 'my-results'
  | 'welcome';

export type ConsumerPageSuggestionCopyKey = keyof Pick<
  ConsumerCopy,
  | 'pageSuggestionBookAmountDue'
  | 'pageSuggestionBookPayCash'
  | 'pageSuggestionBookWhyEmail'
  | 'pageSuggestionManageCancel'
  | 'pageSuggestionManageReschedule'
  | 'pageSuggestionManageSendLink'
  | 'pageSuggestionAccountNextAppointment'
  | 'pageSuggestionAccountTurnOffReminders'
  | 'pageSuggestionAccountRebookLast'
  | 'pageSuggestionHomeCheapestService'
  | 'pageSuggestionHomeWhoFreeTomorrow'
  | 'pageSuggestionMultiPickerDuration'
  | 'pageSuggestionMultiPickerAfternoonSlot'
  | 'pageSuggestionGiftCardApplyPromo'
  | 'pageSuggestionGiftCardExplainTax'
  | 'pageSuggestionMultiCheckoutUseSubscription'
  | 'pageSuggestionMultiCheckoutZeroTotal'
  | 'pageSuggestionPackageVisitCount'
  | 'pageSuggestionPackageBookFirstVisit'
  | 'pageSuggestionLabBookDraw'
  | 'pageSuggestionLabWhyCollection'
  | 'pageSuggestionResultsReleasedMeaning'
  | 'pageSuggestionResultsCbcPending'
  | 'pageSuggestionManageGuestSignIn'
  | 'pageSuggestionManageGuestResendLink'
  | 'pageSuggestionWelcomeSavedSalons'
  | 'pageSuggestionWelcomeGetApp'
>;

export const CONSUMER_PAGE_SUGGESTION_KEYS: Record<
  ConsumerPageSuggestionId,
  readonly ConsumerPageSuggestionCopyKey[]
> = {
  book: [
    'pageSuggestionBookAmountDue',
    'pageSuggestionBookPayCash',
    'pageSuggestionBookWhyEmail',
  ],
  'manage-booking': [
    'pageSuggestionManageCancel',
    'pageSuggestionManageReschedule',
    'pageSuggestionManageSendLink',
  ],
  'manage-booking-guest': [
    'pageSuggestionManageGuestSignIn',
    'pageSuggestionManageGuestResendLink',
  ],
  account: [
    'pageSuggestionAccountNextAppointment',
    'pageSuggestionAccountTurnOffReminders',
    'pageSuggestionAccountRebookLast',
  ],
  'salon-home': [
    'pageSuggestionHomeCheapestService',
    'pageSuggestionHomeWhoFreeTomorrow',
  ],
  'multi-service-picker': [
    'pageSuggestionMultiPickerDuration',
    'pageSuggestionMultiPickerAfternoonSlot',
  ],
  'gift-card-checkout': [
    'pageSuggestionGiftCardApplyPromo',
    'pageSuggestionGiftCardExplainTax',
  ],
  'multi-service-checkout': [
    'pageSuggestionMultiCheckoutUseSubscription',
    'pageSuggestionMultiCheckoutZeroTotal',
  ],
  'package-confirm': [
    'pageSuggestionPackageVisitCount',
    'pageSuggestionPackageBookFirstVisit',
  ],
  'lab-to-book': [
    'pageSuggestionLabBookDraw',
    'pageSuggestionLabWhyCollection',
  ],
  'my-results': [
    'pageSuggestionResultsReleasedMeaning',
    'pageSuggestionResultsCbcPending',
  ],
  welcome: [
    'pageSuggestionWelcomeSavedSalons',
    'pageSuggestionWelcomeGetApp',
  ],
};

function isConsumerBookCheckoutPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (!/^\/s\/[^/]+\/book\//.test(lower)) return false;
  if (/\/book\/(?:any|multi|packages|gift-cards)(\/|$)/.test(lower)) {
    return false;
  }
  return true;
}

/** Resolve consumer-app pathname (+ optional manage query) to a page suggestion bucket. */
export function resolveConsumerPageSuggestionId(
  pathname: string,
  search = '',
): ConsumerPageSuggestionId | null {
  const lower = pathname.toLowerCase();

  if (pathname === '/' || pathname === '') return 'welcome';

  if (/\/manage(\/|$|\?)/.test(lower)) {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const hasToken = Boolean(params.get('token')?.trim());
    const hasBookingId = Boolean(params.get('bookingId')?.trim());
    return hasToken && hasBookingId ? 'manage-booking' : 'manage-booking-guest';
  }

  if (isConsumerBookCheckoutPath(pathname)) return 'book';
  if (/\/book\/any(\/|$|\?)/.test(lower)) return 'multi-service-picker';
  if (/\/gift-cards\/checkout(\/|$|\?)/.test(lower)) return 'gift-card-checkout';
  if (/\/book\/multi\/checkout(\/|$|\?)/.test(lower)) return 'multi-service-checkout';
  if (/\/book\/packages\/[^/]+(\/|$|\?)/.test(lower) && !/\/checkout(\/|$|\?)/.test(lower)) {
    return 'package-confirm';
  }
  if (/\/lab-to-book(\/|$|\?)/.test(lower)) return 'lab-to-book';
  if (/\/results(\/|$|\?)/.test(lower)) return 'my-results';
  if (/\/account(\/|$|\?)/.test(lower)) return 'account';
  if (/^\/s\/[^/]+(\/home)?\/?$/.test(pathname)) return 'salon-home';

  return null;
}

export function buildConsumerPageSuggestions(
  copy: ConsumerCopy,
  pathname: string,
  search = '',
): string[] {
  const pageId = resolveConsumerPageSuggestionId(pathname, search);
  if (!pageId) return [];
  const keys = CONSUMER_PAGE_SUGGESTION_KEYS[pageId];
  return keys.map((key) => copy[key]);
}
