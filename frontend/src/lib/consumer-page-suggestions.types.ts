/** Shared page ids for consumer + public booking assistant chips (ai-cmd-customer-4.9.1). */
export type ConsumerPageSuggestionId =
  | 'book'
  | 'service-list'
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

export const CONSUMER_PAGE_SUGGESTION_I18N_KEYS: Record<
  ConsumerPageSuggestionId,
  readonly string[]
> = {
  book: [
    'public.pageSuggestions.book.amountDue',
    'public.pageSuggestions.book.payCash',
    'public.pageSuggestions.book.whyEmail',
  ],
  'service-list': [
    'public.pageSuggestions.serviceList.servicePrice',
    'public.pageSuggestions.serviceList.payOnlineOrCash',
    'public.pageSuggestions.serviceList.noPrepayment',
  ],
  'manage-booking': [
    'public.pageSuggestions.manage.cancel',
    'public.pageSuggestions.manage.reschedule',
    'public.pageSuggestions.manage.sendLink',
  ],
  'manage-booking-guest': [
    'public.pageSuggestions.manageGuest.signIn',
    'public.pageSuggestions.manageGuest.resendLink',
  ],
  account: [
    'public.pageSuggestions.account.nextAppointment',
    'public.pageSuggestions.account.turnOffReminders',
    'public.pageSuggestions.account.rebookLast',
  ],
  'salon-home': [
    'public.pageSuggestions.home.cheapestService',
    'public.pageSuggestions.home.whoFreeTomorrow',
  ],
  'multi-service-picker': [
    'public.pageSuggestions.multiPicker.duration',
    'public.pageSuggestions.multiPicker.afternoonSlot',
  ],
  'gift-card-checkout': [
    'public.pageSuggestions.giftCard.applyPromo',
    'public.pageSuggestions.giftCard.explainTax',
  ],
  'multi-service-checkout': [
    'public.pageSuggestions.multiCheckout.useSubscription',
    'public.pageSuggestions.multiCheckout.zeroTotal',
  ],
  'package-confirm': [
    'public.pageSuggestions.package.visitCount',
    'public.pageSuggestions.package.bookFirstVisit',
  ],
  'lab-to-book': [
    'public.pageSuggestions.lab.bookDraw',
    'public.pageSuggestions.lab.whyCollection',
  ],
  'my-results': [
    'public.pageSuggestions.results.releasedMeaning',
    'public.pageSuggestions.results.cbcPending',
  ],
  welcome: [
    'public.pageSuggestions.welcome.savedSalons',
    'public.pageSuggestions.welcome.getApp',
  ],
};

/** English defaults mirrored in `AI_PAGE_SUGGESTIONS` consumer section (ai-cmd-customer-4.9.1). */
export const CONSUMER_AI_PAGE_SUGGESTIONS_EN: Record<
  ConsumerPageSuggestionId,
  readonly string[]
> = {
  book: [
    'How much do I pay today?',
    'Pay cash at visit',
    'Why do you need my email?',
  ],
  'service-list': [
    'How much is {service}?',
    'Do I pay online for {service}?',
    'What can I book without paying online?',
  ],
  'manage-booking': [
    'Cancel this appointment',
    'Reschedule to next week',
    'Send manage link',
  ],
  'manage-booking-guest': ['Sign in to manage', 'Resend manage link'],
  account: ['My next appointment', 'Turn off reminders', 'Rebook last visit'],
  'salon-home': ["What's the cheapest service?", "Who's free tomorrow?"],
  'multi-service-picker': [
    'How long will this take?',
    'Find afternoon slot for all services',
  ],
  'gift-card-checkout': ['Apply promo code', 'Explain total with tax'],
  'multi-service-checkout': ['Use my subscription', 'Why is total $0?'],
  'package-confirm': [
    'How many visits in this package?',
    'Book first visit now',
  ],
  'lab-to-book': ['Book my lab draw', 'Why do I need collection?'],
  'my-results': ['What does released mean?', 'Why is CBC still pending?'],
  welcome: ['Find my saved salons', 'How do I get the app?'],
};
