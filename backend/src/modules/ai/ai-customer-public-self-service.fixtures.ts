/** parity-2.3 — customer / public self-service classifier rules + NL scenarios. */

export const CUSTOMER_SELF_SERVICE_CLASSIFIER_RULES = `- cancel_my_booking / reschedule_my_booking: MUTATE — signed-in customer cancels or moves their own visit. Triggers: cancel my booking, reschedule my appointment. NOT cancel_bookings (staff).
- list_my_appointments / my_appointments: READ — upcoming/past visits on account or home tab. Triggers: my appointments, upcoming visits.
- get_manage_link: READ — share manage/cancel link for a booking. Triggers: manage link, send manage url.
- my_profile: READ — account name/email/phone on Account tab. Triggers: my profile, account details.
- my_subscriptions / subscription_usage: READ — active plans and remaining visits/credits. Triggers: my subscriptions, usage left.
- my_gift_cards / gift_card_balance: READ — purchased/redeemed gift cards on account (not checkout code entry). Triggers: my gift cards, gift card balance left.
- discover_packages / discover_subscription_plans / discover_gift_card_products: READ — browse buyable packages, plans, gift products before checkout.
- choose_payment_method / pay_online / pay_cash_at_visit / apply_gift_card_code: MUTATE — checkout payment step after slot/package selected. NOT mark_paid (staff).
- manage_notification_preferences: MUTATE — toggle reminders/marketing on Account tab. NOT enable_push_notifications (provider).
- loyalty_points_balance: READ — rewards points balance on Account tab.`;

export const PUBLIC_SELF_SERVICE_CLASSIFIER_RULES = `- booking_help: READ/MUTATE — manage booking page (cancel/reschedule with token or signed-in account). Triggers: manage my booking, change appointment, cancel visit on manage page.
- my_profile / my_appointments / my_subscriptions / my_gift_cards / gift_card_balance / loyalty_points_balance: READ — signed-in public account tab at /book/:slug/account (same as consumer app account intents).
- discover_packages / discover_subscription_plans / discover_gift_card_products: READ — browse packages, subscription plans, or gift card products before purchase.
- buy_gift_card / buy_gift_card_physical: MUTATE — purchase digital or physical gift card from /book/:slug/gift-cards. NOT adjust_gift_card_balance (admin).
- submit_review: MUTATE — leave a review after visit on /book/:slug/review.
- book_appointment: MUTATE — checkout and schedule (includes package/multi flows).`;

export const CUSTOMER_PUBLIC_SELF_SERVICE_SCENARIOS = [
  { id: 'cust-cancel', prompt: 'Cancel my booking tomorrow', surface: 'customer' as const, expectedAction: 'cancel_my_booking' },
  { id: 'cust-reschedule', prompt: 'Reschedule my appointment to Friday', surface: 'customer' as const, expectedAction: 'reschedule_my_booking' },
  { id: 'cust-list-appts', prompt: 'List my upcoming appointments', surface: 'customer' as const, expectedAction: 'list_my_appointments' },
  { id: 'cust-manage-link', prompt: 'Send me the manage link for my booking', surface: 'customer' as const, expectedAction: 'get_manage_link' },
  { id: 'cust-profile', prompt: 'Show my profile', surface: 'customer' as const, expectedAction: 'my_profile' },
  { id: 'cust-subs', prompt: 'Show my subscriptions', surface: 'customer' as const, expectedAction: 'my_subscriptions' },
  { id: 'cust-gift-cards', prompt: 'Show my gift cards', surface: 'customer' as const, expectedAction: 'my_gift_cards' },
  { id: 'cust-gift-balance', prompt: 'Gift card balance left on my account', surface: 'customer' as const, expectedAction: 'gift_card_balance' },
  { id: 'cust-discover-pkg', prompt: 'What packages are available?', surface: 'customer' as const, expectedAction: 'discover_packages' },
  { id: 'cust-discover-subs', prompt: 'What subscription plans are available?', surface: 'customer' as const, expectedAction: 'discover_subscription_plans' },
  { id: 'cust-payment-method', prompt: 'Choose payment method cash or card', surface: 'customer' as const, expectedAction: 'choose_payment_method' },
  { id: 'cust-notif-prefs', prompt: 'Turn off marketing offers in notifications', surface: 'customer' as const, expectedAction: 'manage_notification_preferences' },
  { id: 'cust-loyalty', prompt: 'Show my reward points balance', surface: 'customer' as const, expectedAction: 'loyalty_points_balance' },
  { id: 'pub-manage', prompt: 'I need to manage my booking and cancel', surface: 'public' as const, expectedAction: 'booking_help' },
  { id: 'pub-profile', prompt: 'Show my account profile', surface: 'public' as const, expectedAction: 'my_profile' },
  { id: 'pub-subs', prompt: 'List my subscriptions on my account', surface: 'public' as const, expectedAction: 'my_subscriptions' },
  { id: 'pub-gift-cards', prompt: 'My ordered gift cards', surface: 'public' as const, expectedAction: 'my_gift_cards' },
  { id: 'pub-loyalty', prompt: 'Show my reward points balance', surface: 'public' as const, expectedAction: 'loyalty_points_balance' },
  { id: 'pub-discover-gift', prompt: 'What gift cards can I buy?', surface: 'public' as const, expectedAction: 'discover_gift_card_products' },
  { id: 'pub-buy-gift', prompt: 'Buy a $50 gift card', surface: 'public' as const, expectedAction: 'buy_gift_card' },
  { id: 'pub-review', prompt: 'Leave a review for my visit', surface: 'public' as const, expectedAction: 'submit_review' },
  { id: 'pub-appts', prompt: 'Show my appointments on my account', surface: 'public' as const, expectedAction: 'my_appointments' },
  { id: 'pub-discover-pkg', prompt: 'Browse available packages', surface: 'public' as const, expectedAction: 'discover_packages' },
] as const;
