export type AppLocale = 'en' | 'hy' | 'ru';

export const SUPPORTED_LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

const LOCALE_NAMES: Record<AppLocale, string> = {
  en: 'English',
  hy: 'Armenian',
  ru: 'Russian',
};

export function resolveLocale(
  preferred?: string | null,
  fallback: AppLocale = 'en',
): AppLocale {
  if (preferred && SUPPORTED_LOCALES.includes(preferred as AppLocale)) {
    return preferred as AppLocale;
  }
  return fallback;
}

export function localeLanguageInstruction(locale: AppLocale): string {
  if (locale === 'hy')
    return 'Always respond to the customer in Armenian (Հայերեն).';
  if (locale === 'ru')
    return 'Always respond to the customer in Russian (Русский).';
  return 'Respond to the customer in English.';
}

export function localeDisplayName(locale: AppLocale): string {
  return LOCALE_NAMES[locale];
}

type MessageTree = { [key: string]: string | MessageTree };

const en: MessageTree = {
  assistant: {
    unavailable:
      'The booking assistant is temporarily unavailable. Please use the booking steps below.',
    unknown:
      'I didn\'t quite catch that. Try asking who is available, what services you offer, or say something like "Book a massage with Gevorg tomorrow at 10:00".',
    helpPrompt:
      'I can help you find a specialist, check open times, see services and prices, or book an appointment. What would you like to do?',
    // e2e-bug.127 — security_blocked / action-denied summaries (no raw action ids).
    securityInjection:
      'That request tries to override system rules. I can only run allowed booking and schedule commands for your role.',
    securityDataExport:
      'Bulk customer export is not available via AI. Ask for a ranked summary (e.g. "top 5 VIP customers") or use CRM export in Settings.',
    securityAvailabilityBypass:
      'I cannot book or reschedule into unavailable slots. I can check availability or find the next open time.',
    securityDefault: 'That command is not allowed for security reasons.',
    deniedPublic:
      'That action is not available here. Try rephrasing or use the booking steps.',
    deniedCustomer:
      'That action is not available in the customer assistant. Try rephrasing or use the booking menu.',
    // e2e-bug.126 — unknown-intent clarify lead sentence (per surface).
    unknownIntentProvider:
      "I'm not sure what you meant. Pick one of these, or rephrase your request.",
    unknownIntentCustomer:
      "I didn't fully understand that. What would you like to do?",
    unknownIntentDashboard:
      "I didn't fully understand that command. Which of these did you mean?",
    // e2e-bug.239 — empty/blocked prompt action:error (customer gateway).
    requestError: 'Could not understand that request. Try rephrasing.',
    // e2e-bug.259 — guide support handoff chrome (Still stuck?).
    guideStillStuck: 'Still stuck?',
    guideSupportTicketSubject: 'Product guide help{topic} ({surface})',
    guideSupportTicketBodyHeader: 'Product guide support handoff (no PII)',
    guideSupportTicketBodyFooter:
      'The user finished the in-app guide and still needs help.',
    // e2e-bug.259 — explain_any_provider_option clarify / summary.
    anyProviderClarify:
      'Ask what Any stylist means, whether someone will be assigned, or how to pick any provider on checkout.',
    anyProviderMeaning:
      'Any available specialist means you do not pick a named stylist upfront — we match whoever is free for your service and time slot.',
    anyProviderAssignment:
      'When you leave Any stylist selected, the salon assigns an available specialist when you confirm the booking; their name appears on your confirmation.',
    anyProviderPicker:
      'Tap the specialist row on checkout, then choose Any available specialist at the top of the list, or pick someone by name.',
    anyProviderTeamNote:
      ' This salon has {count} active specialists who can be matched.',
    anyProviderLabel: 'Any available specialist',
    // e2e-bug.274 — confirm_my_booking_details anon/missing clarifies.
    confirmBookingAnonClarify:
      'Finish booking or sign in so I can read your appointment details from the session.',
    confirmBookingSignedInMissing:
      'I could not find an upcoming booking to summarize. Finish checkout or pick an appointment from your account.',
    confirmBookingManageLinkClarify:
      'Share the manage link for this booking first, so I can look it up.',
    // e2e-bug.276 — explain_home_screen_widget unrecognized-prompt clarify.
    homeScreenWidgetClarify:
      'Ask about the home screen widget (e.g. "Add next appointment to home screen" or "What does the widget show?").',
    // e2e-bug.317 — explain_home_screen_widget success copy (hy/ru), deterministic to avoid LLM-enrich flake.
    homeScreenWidgetUnsupportedInstall:
      'Home-screen widgets are available in the native iOS and Android consumer apps, not in the mobile browser.',
    homeScreenWidgetUnsupportedInstructions:
      'Install OptiSchedule Book from the app store, sign in, then add the widget from your phone home screen.',
    homeScreenWidgetOpenPicker:
      'Open your phone home screen widget picker and choose OptiSchedule Book.',
    homeScreenWidgetAddIos:
      'On iPhone: long-press the home screen → tap Add (+) → search OptiSchedule Book → add the widget.',
    homeScreenWidgetAddAndroid:
      'On Android: long-press the home screen → Widgets → find OptiSchedule Book → drag it onto your home screen.',
    homeScreenWidgetAddGeneric:
      'On iPhone use the Add (+) widget gallery; on Android use the Widgets menu after a long-press on the home screen.',
    homeScreenWidgetStaySignedIn:
      'Stay signed in and open Account once so the app can sync your next visit and quick rebook snapshot.',
    homeScreenWidgetShowsTiles:
      'The widget shows your salon name plus up to two tiles: Next appointment (widgetNextAppointment*) and Book again (widgetQuickRebook*).',
    homeScreenWidgetTapBehavior:
      'Tapping next appointment opens Account; tapping Book again opens booking with rebookSource=widget.',
    homeScreenWidgetSignedOutNote:
      'You are signed out — the widget shows a sign-in prompt instead of visits.',
    homeScreenWidgetNextApptWithSubtitle:
      'Your snapshot includes a next appointment ({subtitle}).',
    homeScreenWidgetNextApptWithService:
      'Your snapshot includes a next appointment for {service}.',
    homeScreenWidgetNextApptGeneric:
      'Your snapshot currently includes a next appointment.',
    homeScreenWidgetQuickRebookAvailable:
      'No upcoming visit is synced yet, but a quick rebook tile is available from your last completed booking.',
    homeScreenWidgetAuthedNoData:
      'You are signed in but no upcoming visit or completed rebook tile is synced yet — open Account to refresh bookings.',
    homeScreenWidgetNextTileUsage:
      'The Next appointment tile uses widgetNextAppointmentTitle and shows the nearest confirmed or pending future booking.',
    homeScreenWidgetNextTileBehavior:
      'It displays service, date, time, and provider, and opens your Account tab when tapped.',
    homeScreenWidgetCurrentSnapshotService:
      'Current snapshot service: {service}.',
    homeScreenWidgetNoUpcomingSnapshot:
      'No upcoming booking is in the widget snapshot right now.',
    homeScreenWidgetQuickRebookSource:
      'Book again on the widget comes from your most recent completed visit (widgetQuickRebook*).',
    homeScreenWidgetQuickRebookDeepLink:
      'It deep-links into booking with the same service and rebookSource=widget so you can pick a new slot quickly.',
    homeScreenWidgetQuickRebookShortcut:
      'It is a shortcut — not the same as asking the assistant to rebook for you inside the app.',
    homeScreenWidgetSignedOutTiles:
      'When you are signed out, the widget shows widgetSignedOutTitle and widgetSignedOutSubtitle with a link to open the salon.',
    homeScreenWidgetSignedOutSignIn:
      'Sign in on the consumer app and revisit Account so the widget snapshot can include your visits.',
    homeScreenWidgetHowItWorksSnapshot:
      'The app builds a home_screen_widget_snapshot from your bookings and syncs it to iOS WidgetKit / Android App Widget on native platforms.',
    homeScreenWidgetHowItWorksRefresh:
      'Account and salon tabs refresh the snapshot when bookings change or the app returns to the foreground.',
    homeScreenWidgetWebUnsupportedNote:
      'Widgets require the installed native app — they are not available on web.',
    // e2e-bug.299 — give_ai_feedback chip/summary labels.
    feedbackUpLabel: 'Helpful',
    feedbackDownLabel: 'Not helpful',
    feedbackThanks: 'Thanks — this helps improve the assistant.',
    feedbackReasonWrongAction: 'Wrong action',
    feedbackReasonWrongDate: 'Wrong date',
    feedbackReasonWrongPerson: 'Wrong person',
    feedbackReasonWrongService: 'Wrong service',
    feedbackReasonDidNotUnderstand: "Didn't understand",
    feedbackReasonSkip: 'Skip',
    feedbackDownChooseReason:
      'Not helpful — choose a reason so we can improve the assistant.',
    feedbackClarifyWhatWasWrong:
      'Say whether the last answer was helpful or what was wrong (e.g. "That was wrong" or "Wrong date picked").',
    feedbackClarifyHelpfulOrNot:
      'Say if the answer was helpful or not (e.g. "That was helpful" or "Not helpful").',
    // e2e-bug.325 — give_provider_ai_feedback chip/summary labels.
    providerFeedbackUpLabel: 'Helpful',
    providerFeedbackDownLabel: 'Not helpful',
    providerFeedbackThanks:
      'Thanks — this helps improve the provider assistant.',
    providerFeedbackReasonWrongAction: 'Wrong action',
    providerFeedbackReasonWrongDate: 'Wrong date',
    providerFeedbackReasonWrongClient: 'Wrong client',
    providerFeedbackReasonWrongService: 'Wrong service',
    providerFeedbackReasonDidNotUnderstand: "Didn't understand",
    providerFeedbackDownChooseReason:
      'Not helpful — choose a reason so we can improve the assistant.',
    providerFeedbackClarifyWhatWasWrong:
      'Say whether the last answer was helpful or what was wrong (e.g. "Wrong client picked" or "That wasn\'t my intent").',
    providerFeedbackClarifyHelpfulOrNot:
      'Say if the answer was helpful or not (e.g. "That was helpful" or "Not helpful").',
    // e2e-bug.301 — explain_dashboard_only_action summaries.
    dashboardHandoffTemplate:
      '"{action}" isn\'t available from the mobile assistant: {reason}. Use the dashboard for this.',
    dashboardHandoffFallback:
      'That feature is managed from the dashboard, not the mobile assistant. Open the dashboard for this.',
    dashboardHandoffActionTapCall: 'Tap phone to call client',
    dashboardHandoffReasonTapCall:
      'Native tel: deep link — messaging parity via send_client_message',
    dashboardHandoffActionIntake: 'Open full intake answers (manager link)',
    dashboardHandoffReasonIntake:
      'Clinical/intake admin and PHI review on dashboard web',
    dashboardHandoffActionReview: 'Request review from client',
    dashboardHandoffReasonReview:
      'Review request policy and triggers configured on dashboard',
    dashboardHandoffActionTemplates: 'Edit canned message templates',
    dashboardHandoffReasonTemplates:
      'Template CRUD is business admin configuration on dashboard web',
    dashboardHandoffActionLoyalty: 'Adjust loyalty points',
    dashboardHandoffReasonLoyalty:
      'Point adjustments are dashboard CRM / admin AI only (adjust_loyalty)',
    dashboardHandoffActionLocale: 'Switch app language (EN/HY/RU)',
    dashboardHandoffReasonLocale:
      'Locale picker is client UI — not an operational AI intent',
    dashboardHandoffActionTimeOff: 'Approve or deny time-off request',
    dashboardHandoffReasonTimeOff:
      'Manager approval uses dashboard approve_time_off_request / deny_time_off_request',
    // e2e-bug.327 — explain_reassign_limit / explain_time_off_approval summaries.
    reassignLimitReason:
      'Same-day reassignment uses the dedicated mobile API; AI reschedule_booking only moves time slots — complex multi-service reassignment stays on the dashboard',
    reassignLimitTemplate:
      "{reason}. Use the Reassign button on the booking's dashboard page for multi-service visits.",
    timeOffApprovalReason:
      "manager approval uses the dashboard's approve_time_off_request / deny_time_off_request actions",
    timeOffApprovalTemplate:
      "Your manager approves or denies time-off requests — {reason}. You'll see the status update (pending, approved, or denied) once they review it.",
    // e2e-bug.328 — my_stats "Your/Team stats…" summary.
    myStatsScopeYour: 'Your',
    myStatsScopeTeam: 'Team',
    myStatsPeriodMonth: 'this month',
    myStatsPeriodWeek: 'this week',
    myStatsCompletedVisits: '{scope} stats {period}: {count} completed {noun}',
    myStatsPaidRevenue: '{amount} paid revenue',
    myStatsUtilization: '{percent}% utilization ({booked}/{scheduled} min)',
    myStatsAvgReview: '{score}★ avg from {count} new {noun}',
    myStatsTips: '{amount} tips across {count} {noun}',
    myStatsVisitOne: 'visit',
    myStatsVisitFew: 'visits',
    myStatsVisitMany: 'visits',
    myStatsReviewOne: 'review',
    myStatsReviewFew: 'reviews',
    myStatsReviewMany: 'reviews',
    // e2e-bug.302 — product-guide unmatched topic clarify.
    guideTopicMissClarify:
      'I could not match that to a guide topic yet. Try naming the page — Schedule, Operations, AI command bar — or open Help & guide from the sidebar.',
    // e2e-bug.289 — list_tour_calendar_week empty/success/clarify (hy/ru).
    tourCalendarWeekEmpty:
      'No confirmed tour departures visible on the provider calendar week {weekLabel}{providerNote}{filterNote}.',
    tourCalendarWeekSuccess:
      '{count} tour departure(s) on calendar week {weekLabel}{providerNote}{filterNote}: {entries}.',
    tourCalendarWeekClarify:
      'Ask to list tour departures on the provider calendar week (e.g. "List tour departures on the provider calendar this week" or "Summarize Maria\'s calendar week tours with pax").',
    tourCalendarWeekProviderMissing:
      'Could not find provider "{name}" for calendar week tour list.',
    tourCalendarWeekProviderNote: ' for {name}',
    tourCalendarWeekFilterNote: ' ({service})',
    tourCalendarWeekEntryPax: '{count} pax',
    // e2e-bug.311 — explain_clinic_services empty/success/clarify (hy/ru).
    clinicServicesEmpty:
      'No clinic catalog services are currently available{filterNote}.',
    clinicServicesEmptyFilterNote: ' for "{service}"',
    clinicServicesStats:
      '{total} clinic service(s){filterNote}: {consultation} consultation, {labTest} lab test, {procedure} procedure{unclassifiedNote}.',
    clinicServicesUnclassifiedNote: ', {count} unclassified',
    clinicServicesDepartments: 'Departments: {departments}.',
    clinicServicesFastingNone: 'No lab tests require fasting.',
    clinicServicesFastingList: 'Fasting required: {names}.',
    clinicServicesClarify:
      'Ask about clinic catalog services (e.g. "Explain our clinic services and department counts" or "Which lab tests require fasting?").',
    // e2e-bug.312 — create_service_category success (hy/ru), deterministic to avoid LLM-enrich flake.
    catalogCategoryCreated: 'Created category "{categoryName}".',
    catalogCategoryCreatedWithServices:
      'Created category "{categoryName}" with {count} placeholder service(s).',
    noSpecialists:
      'No specialists are available for booking right now. Please contact the business directly.',
    specialistsHeader: 'Here are our specialists:',
    noUpcomingSlots: 'No upcoming slots',
    open: 'Open',
    nextOn: 'Next on',
    nearestNeedsService:
      'Which service would you like to book? Tell me the service name for the nearest available slot.',
    noNearestSlot:
      'No upcoming open slots for {service}{after} in the next two weeks. Try another service or contact us directly.',
    availabilityNeedsDayOrService:
      'Which day or service should I check? For example: "Free slots on Monday and Friday for massage" or "When is Gevorg free tomorrow?"',
    // e2e-bug.93 — named specialist without a day must keep the name in clarify.
    availabilityNeedsDayForProvider:
      'Which day should I check for {name}? For example: "When is {name} free tomorrow?" or "Is {name} available this week?"',
    availabilityNeedsDay:
      'Which day should I check for {service}? You can say Monday and Friday, this week, or tomorrow.',
    availabilityServiceNotFound:
      'I couldn\'t find "{service}". Available services: {available}.',
    availabilityProviderNotFound:
      'I couldn\'t find "{name}". Available specialists: {available}.',
    availabilityNoSlots:
      'No open slots for {service} with {provider} on the requested day(s) ({days}). Try another day or specialist.',
    availabilityNoSlotsBudget:
      'No open slots for {service} with {provider} on the requested day(s) ({days}) among options under ${maxPrice}. Try another day or specialist.',
    availabilityHeader: 'Open slots for {service} ({days} day(s)):',
    availabilityHeaderBudget:
      'Open slots for {service} (options under ${maxPrice}) ({days} day(s)):',
    availabilityHeaderOptions: 'Open slots for {service} ({count} options):',
    availabilityHeaderOptionsBudget:
      'Open slots for {service} (options under ${maxPrice}) ({count} options):',
    availabilityDaySingleProvider: '{weekday} {date}: {times}',
    availabilityTimeOfDayMorning: 'morning',
    availabilityTimeOfDayAfternoon: 'afternoon',
    availabilityTimeOfDayEvening: 'evening',
    availabilityWindowTomorrow: 'Tomorrow {timeOfDay}',
    availabilityWindowTomorrowPlain: 'Tomorrow',
    availabilityWindowToday: 'Today {timeOfDay}',
    availabilityWindowTodayPlain: 'Today',
    availabilityWindowWeekday: '{weekday} {timeOfDay}',
    availabilityWindowDate: '{date} {timeOfDay}',
    availabilityWindowNoSlots: 'No open slots for {label}.',
    availabilityNearestAlternative:
      'Nearest opening: {weekday} {date} at {time} with {provider}.',
    availabilityOverlapTomorrowIsWeekday:
      'Tomorrow is {weekday} — these are two time windows on the same day.',
    availabilityOverlapSameDay:
      'These options fall on the same day ({weekday}) — checking each time window separately.',
    anyService: 'any service',
    anySpecialist: 'any specialist',
    recommendNeedsService:
      'Which service should I rank specialists for? Available: {services}.',
    recommendHeader: 'Top-rated specialists for {service} ({period}):',
    recommendLine: '{rank}. {name}{role} — {rating}{service} — {date}: {times}',
    recommendNoReviews: 'No reviews yet',
    recommendRating: '★ {rating} ({count} reviews)',
    recommendServiceNote: ' · {service}',
    recommendNoMatches:
      'No available specialists for {service} during {period}. Try other days or services.',
    recommendPeriodDays: '{count} days',
  },
  booking: {
    emailOrPhoneRequired: 'Email or phone number is required',
    invalidCredentials: 'Invalid credentials',
    emailRegistered: 'Email already registered',
  },
  email: {
    appointment: 'appointment',
    appointments: 'appointments',
    defaultServiceName: 'Appointment',
    defaultProviderName: 'your provider',
    defaultCustomerName: 'there',
    footerNote: 'See you soon!',
    reminderHours: '{count} hours',
    reminderMinutes: '{count} minutes',
    reminderNow: 'now',
    servicePriceLine: 'Price: {price}',
    amountPaidLine: 'Amount paid: {price}',
    receiptSubtotalLine: 'Subtotal: {price}',
    receiptTaxLine: '{name} ({rate}%): {prefix}{price}',
    receiptTaxIncluded: 'included',
    receiptTotalLine: 'Total: {price}',
    taxRegistrationFooter: 'Tax registration: {number}',
    giftCardBalanceLine: 'Balance: {price}',
    giftCardPurchaseLine: 'Amount paid: {price}',
    appInstallPromoHeading: 'Get the OptiSchedule app',
    appInstallPromoLinkLabel: 'Install or open the app for this salon',
    appInstallPromoText:
      'Get the OptiSchedule app for easy rebooking and reminders: {url}',
    appInstallQrAlt: 'QR code to install the OptiSchedule app for this salon',
    clinicResultReadySubject: 'Your test results are ready — {businessName}',
    clinicResultReadyBody:
      'Hi {customerName}, your {testName} results are ready (released {whenLabel}). {accountLine}',
    clinicResultReadySms:
      '{businessName}: Your {testName} results are ready ({whenLabel}). {accountLine}',
    clinicResultReadyWhatsappLabel: 'Results ready ({whenLabel})',
    clinicResultReadyAccountLink: 'View results: {url}',
    clinicResultReadyPushTitle: '{businessName}: Results ready',
    clinicResultReadyPushBody: 'Your {testName} results are ready to view.',
    clinicResultReadyPushForegroundHint:
      '{testName} results ready — tap to view',
    clinicLabBookingRequestSubject:
      'Please book your lab appointment — {businessName}',
    clinicLabBookingRequestBody:
      'Hi {customerName}, your clinic ordered {testNames}. Book your {collectionServiceName} visit: {bookUrl}',
    clinicLabBookingRequestSms:
      '{businessName}: Book your {collectionServiceName} for ordered labs ({testNames}): {bookUrl}',
    clinicLabBookingRequestWhatsapp:
      'Book {collectionServiceName} for ordered labs ({testNames})',
    clinicLabBookingRequestPushTitle: '{businessName}: Book lab collection',
    clinicLabBookingRequestPushBody:
      'Book your {collectionServiceName} for ordered labs ({testNames}).',
    clinicLabBookingRequestPushForegroundHint:
      '{collectionServiceName} — tap to book',
    bookingConfirmedPushTitle: '{businessName}: Booking confirmed',
    bookingConfirmedPushBody:
      '{serviceName} on {scheduleLabel} — tap to view details.',
    bookingConfirmedPushForegroundHint:
      'Confirmed: {serviceName} on {scheduleLabel}',
    bookingReminderPushTitle: '{businessName}: Appointment reminder',
    bookingReminderPushBody: '{serviceName} on {scheduleLabel} — see you soon.',
    bookingReminderPushForegroundHint:
      'Reminder: {serviceName} on {scheduleLabel}',
    bookingRescheduledPushTitle: '{businessName}: Appointment rescheduled',
    bookingRescheduledPushBody: '{serviceName} is now on {scheduleLabel}.',
    bookingRescheduledPushForegroundHint:
      'Rescheduled to {scheduleLabel} — tap to view',
    bookingCancelledPushTitle: '{businessName}: Appointment cancelled',
    bookingCancelledPushBody: '{serviceName} on {scheduleLabel} was cancelled.',
    bookingCancelledPushForegroundHint:
      '{serviceName} cancelled — tap to rebook',
    providerRunningLatePushTitle: '{businessName}: Running late',
    providerRunningLatePushBody:
      '{providerName} is running about {minutesLate} minutes late for {serviceName}.',
    providerRunningLatePushForegroundHint:
      '{providerName} is running {minutesLate}m late',
    providerReadyNowPushTitle: '{businessName}: Ready for you',
    providerReadyNowPushBody:
      '{providerName} is ready for your {serviceName} now.',
    providerReadyNowPushForegroundHint: '{providerName} is ready for you',
    giftCardReceivedPushTitle: '{businessName}: Gift card received',
    giftCardReceivedPushBody: 'You received a gift card from {senderName}.',
    giftCardReceivedPushForegroundHint:
      'Gift card from {senderName} — tap to view',
    rebookingNudgePushTitle: '{businessName}: Time to rebook',
    rebookingNudgePushBody:
      'Your next {serviceName} is due ({cadenceLabel}). Tap to book.',
    rebookingNudgePushForegroundHint: 'Time for {serviceName} — tap to book',
    rebookingNudgeEmailSubject:
      'Time for your next {serviceName} — {businessName}',
    rebookingNudgeMessage:
      'Hi {customerName}, it is time for your next {serviceName} at {businessName}. Book here: {bookUrl}.{promoLine}',
    winBackEmailSubject: "We'd love to see you again — {businessName}",
    winBackMessage:
      'Hi {customerName}, we miss you at {businessName}! Book your next visit: {bookUrl}.{promoLine}{loyaltyLine}',
    winBackPromoLine: ' Use code {promoCode} when you book.',
    winBackLoyaltyLine: ' We added ${bonusAmount} in rewards to your account.',
    winBackPushTitle: '{businessName}: We miss you',
    winBackPushBody:
      'It has been a while — book your next visit at {businessName}.{promoLine}',
    winBackPushForegroundHint: 'Tap to book at {businessName}',
    activationConcierge24hEmailSubject:
      'Pick up where you left off — {businessName}',
    activationConcierge24hMessage:
      'Hi {customerName}, you started booking {serviceName} at {businessName}. Tap to finish in one step: {bookUrl}',
    activationConcierge24hPushTitle: '{businessName}: Finish your booking',
    activationConcierge24hPushBody:
      'Your {serviceName} booking is waiting — tap to resume.',
    activationConcierge24hPushForegroundHint: 'Tap to resume {serviceName}',
    activationConcierge72hEmailSubject:
      'Still want {serviceName}? — {businessName}',
    activationConcierge72hMessage:
      'Hi {customerName}, your {serviceName} booking at {businessName} is still saved. Continue here: {bookUrl}',
    activationConcierge72hPushTitle: '{businessName}: Your booking is saved',
    activationConcierge72hPushBody:
      'Resume {serviceName} with one tap before the slot goes.',
    activationConcierge72hPushForegroundHint: 'One tap to resume {serviceName}',
  },
  pdf: {
    clinicAfterVisitSummary: {
      title: 'After-Visit Summary',
      patientLabel: 'Patient:',
      visitLabel: 'Visit:',
      serviceLabel: 'Service:',
      providerLabel: 'Provider:',
      summaryHeading: 'Summary',
      defaultProvider: 'Provider',
      defaultService: 'Consultation',
      printButton: 'Print / Save as PDF',
    },
  },
  providerSuggestions: {
    confirmPendingTitle: '{count} appointment(s) need confirmation',
    confirmPendingPrompt:
      'Show my appointments today that still need confirmation',
    unpaidTodayTitle: '{count} unpaid appointment(s) today',
    unpaidTodayPrompt: 'Mark all completed appointments today as paid',
    gapsTodayTitle: '{count} open slot(s) this afternoon',
    gapsTodayPrompt: "What's on my schedule this afternoon? Any gaps?",
    nextUpTitle: 'Next: {customer} at {time}',
    nextUpPrompt: "Mark {customer}'s appointment at {time} as done and paid",
    emptyTodayTitle: 'No appointments today',
    // e2e-bug.66 — must match summarize_day rescue/classifier (not get_schedule_summary ranges).
    emptyTodayPrompt: "How's today looking?",
    defaultClient: 'client',
  },
  clinic: {
    labState: {
      gate: {
        disabledReason:
          'Lab orders, results, and specimens are only available for clinic vertical business types (clinic, polyclinic, beauty_clinic, dental).',
      },
      order: {
        NotCollected: 'Not collected',
        Collecting: 'Collecting',
        AwaitingResults: 'Awaiting results',
        Completed: 'Completed',
        Cancelled: 'Cancelled',
      },
      result: {
        NotReceived: 'Not received',
        Pending: 'Pending',
        WaitingCompletion: 'Waiting completion',
        Completed: 'Completed',
        Reviewed: 'Reviewed',
        AutomaticallyReviewed: 'Automatically reviewed',
        Released: 'Released',
        Rejected: 'Rejected',
      },
      specimen: {
        NotCollected: 'Not collected',
        Collected: 'Collected',
        ReadyForTransport: 'Ready for transport',
        InTransit: 'In transit',
        ReceivedInLab: 'Received in lab',
        Completed: 'Completed',
        RecollectRequired: 'Recollect required',
        RetestRequired: 'Retest required',
        Rejected: 'Rejected',
      },
      measurement: {
        Normal: 'Normal',
        Abnormal: 'Abnormal',
        High: 'High',
        Low: 'Low',
        Inconclusive: 'Inconclusive',
        Indeterminate: 'Indeterminate',
        TestNotComplete: 'Test not completed',
        NotApplicable: 'Not applicable',
        SeeDetails: 'See details',
      },
      patientVisibility: {
        New: 'New',
        Pending: 'Pending',
        Read: 'Read',
      },
    },
  },
};

const hy: MessageTree = {
  assistant: {
    unavailable:
      'Ամրագրման օգնականը ժամանակավորապես անհասանելի է։ Խնդրում ենք օգտագործել ստորևի ամրագրման քայլերը։',
    unknown:
      'Չհասկացա։ Փորձեք հարցնել՝ ով է ազատ, ինչ ծառայություններ ունեք, կամ ասեք՝ «Ամրագրիր massage Gevorg-ի հետ վաղը 10:00-ին»։',
    helpPrompt:
      'Կարող եմ օգնել գտնել մասնագետ, ստուգել ազատ ժամերը, տեսնել ծառայություններն ու գները կամ ամրագրել։ Ի՞նչ եք ցանկանում։',
    securityInjection:
      'Այդ հարցումը փորձում է շրջանցել համակարգի կանոնները։ Ես կարող եմ կատարել միայն ձեր դերին թույլատրված ամրագրման և ժամանակացույցի հրամանները։',
    securityDataExport:
      'Հաճախորդների զանգվածային արտահանումը AI-ով հասանելի չէ։ Խնդրեք վարկանիշային ամփոփում (օր. «թոփ 5 VIP հաճախորդներ») կամ օգտագործեք CRM արտահանումը Կարգավորումներում։',
    securityAvailabilityBypass:
      'Չեմ կարող ամրագրել կամ վերաժամանակացնել անհասանելի ժամերում։ Կարող եմ ստուգել հասանելիությունը կամ գտնել հաջորդ ազատ ժամը։',
    securityDefault: 'Այդ հրամանը անվտանգության պատճառով թույլատրված չէ։',
    deniedPublic:
      'Այդ գործողությունը այստեղ հասանելի չէ։ Փորձեք վերաձևակերպել կամ օգտագործել ամրագրման քայլերը։',
    deniedCustomer:
      'Այդ գործողությունը հաճախորդի օգնականում հասանելի չէ։ Փորձեք վերաձևակերպել կամ օգտագործել ամրագրման ընտրացանկը։',
    // e2e-bug.126 — unknown-intent clarify lead sentence (per surface).
    unknownIntentProvider:
      'Հգիտեմ ինչ նկատի ունեիք։ Ընտրեք ստորևներից մեկը կամ վերաձևակերպեք հարցումը։',
    unknownIntentCustomer:
      'Ամբողջությամբ չհասկացա։ Ի՞նչ կցանկանայիք անել։',
    unknownIntentDashboard:
      'Ամբողջությամբ չհասկացա այդ հրամանը։ Ո՞ր տարբերակն էիք նկատի ունեցել։',
    // e2e-bug.239 — empty/blocked prompt action:error (customer gateway).
    requestError: 'Չհաջողվեց հասկանալ այդ հարցումը։ Փորձեք վերաձևակերպել։',
    // e2e-bug.259 — guide support handoff chrome.
    guideStillStuck: 'Դեռ չի՞ ստացվում',
    guideSupportTicketSubject: 'Ապրանքի ուղեցույցի օգնություն{topic} ({surface})',
    guideSupportTicketBodyHeader:
      'Ապրանքի ուղեցույցի աջակցության փոխանցում (առանց PII)',
    guideSupportTicketBodyFooter:
      'Օգտատերը ավարտել է հավելվածի ուղեցույցը և դեռ օգնության կարիք ունի։',
    // e2e-bug.259 — explain_any_provider_option.
    anyProviderClarify:
      'Հարցրեք ինչ է նշանակում «Ցանկացած մասնագետ», արդյոք մեկը կնշանակվի, կամ ինչպես ընտրել ցանկացած մասնագետ վճարման էջում։',
    anyProviderMeaning:
      '«Ցանկացած հասանելի մասնագետ» նշանակում է, որ դուք չեք ընտրում անունով վարսահարդար նախապես — մենք համապատասխանեցնում ենք նրան, ով ազատ է ձեր ծառայության և ժամի համար։',
    anyProviderAssignment:
      'Երբ թողնում եք «Ցանկացած մասնագետ» ընտրված, սրահը նշանակում է հասանելի մասնագետ ամրագրումը հաստատելիս· նրա անունը երևում է հաստատման մեջ։',
    anyProviderPicker:
      'Վճարման էջում սեղմեք մասնագետի տողը, ապա ընտրեք «Ցանկացած հասանելի մասնագետ» ցանկի վերևում, կամ ընտրեք անունով։',
    anyProviderTeamNote:
      ' Այս սրահում կա {count} ակտիվ մասնագետ, որոնք կարող են համապատասխանեցվել։',
    anyProviderLabel: 'Ցանկացած հասանելի մասնագետ',
    // e2e-bug.289 — list_tour_calendar_week empty/success/clarify (hy/ru).
    tourCalendarWeekEmpty:
      'Տրամադրողի օրացույցում {weekLabel} շաբաթվա համար հաստատված էքսկուրսիայի մեկնարկներ չկան{providerNote}{filterNote}։',
    tourCalendarWeekSuccess:
      'Օրացույցի {weekLabel} շաբաթում {count} էքսկուրսիայի մեկնարկ{providerNote}{filterNote}՝ {entries}։',
    tourCalendarWeekClarify:
      'Խնդրեք ցուցադրել էքսկուրսիաների մեկնարկները տրամադրողի օրացույցի շաբաթում (օր. «Ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում» կամ «Ամփոփիր Մարիայի շաբաթվա էքսկուրսիաները pax-ով»)։',
    tourCalendarWeekProviderMissing:
      'Չգտա «{name}» տրամադրողին շաբաթվա էքսկուրսիաների ցանկի համար։',
    tourCalendarWeekProviderNote: '՝ {name}-ի համար',
    tourCalendarWeekFilterNote: ' ({service})',
    tourCalendarWeekEntryPax: '{count} ուղևոր',
    // e2e-bug.311 — explain_clinic_services empty/success/clarify (hy/ru).
    clinicServicesEmpty:
      'Կլինիկական կատալոգում ծառայություններ այս պահին հասանելի չեն{filterNote}։',
    clinicServicesEmptyFilterNote: '՝ «{service}»-ի համար',
    clinicServicesStats:
      '{total} կլինիկական ծառայություն{filterNote}՝ {consultation} խորհրդատվություն, {labTest} լաբ թեստ, {procedure} պրոցեդուրա{unclassifiedNote}։',
    clinicServicesUnclassifiedNote: ', {count} դասակարգված չէ',
    clinicServicesDepartments: 'Բաժիններ՝ {departments}։',
    clinicServicesFastingNone: 'Ծոմավոր պահանջող լաբ թեստեր չկան։',
    clinicServicesFastingList: 'Ծոմավոր է պահանջվում՝ {names}։',
    clinicServicesClarify:
      'Հարցրեք կլինիկական կատալոգի ծառայությունների մասին (օր. «Բացատրի՛ր մեր կլինիկական ծառայությունները» կամ «Որ լաբ թեստերն են ծոմավոր պահանջող»)։',
    // e2e-bug.312 — create_service_category success (hy/ru), deterministic to avoid LLM-enrich flake.
    catalogCategoryCreated: 'Ստեղծվեց «{categoryName}» կատեգորիան։',
    catalogCategoryCreatedWithServices:
      'Ստեղծվեց «{categoryName}» կատեգորիան՝ {count} օրինակելի ծառայությամբ։',
    // e2e-bug.274 — confirm_my_booking_details.
    confirmBookingAnonClarify:
      'Ավարտեք ամրագրումը կամ մուտք գործեք, որպեսզի կարողանամ կարդալ ձեր այցի մանրամասները սեսիայից։',
    confirmBookingSignedInMissing:
      'Չգտա ամփոփելու առաջիկա ամրագրում։ Ավարտեք վճարումը կամ ընտրեք այց ձեր հաշվից։',
    confirmBookingManageLinkClarify:
      'Նախ կիսվեք այս ամրագրման կառավարման հղումով, որպեսզի կարողանամ գտնել այն։',
    // e2e-bug.276 — explain_home_screen_widget unrecognized-prompt clarify.
    homeScreenWidgetClarify:
      'Հարցրեք հիմնական էկրանի վիջեթի մասին (օր. «Ավելացնել հաջորդ հանդիպումը հիմնական էկրանին» կամ «Ինչ է ցույց տալիս վիջեթը»)։',
    // e2e-bug.317 — explain_home_screen_widget success copy (hy/ru), deterministic to avoid LLM-enrich flake.
    homeScreenWidgetUnsupportedInstall:
      'Հիմնական էկրանի վիջեթները հասանելի են iOS և Android հավելվածներում, ոչ թե բջջային բրաուզերում։',
    homeScreenWidgetUnsupportedInstructions:
      'Տեղադրեք OptiSchedule Book հավելվածների խանութից, մուտք գործեք, ապա ավելացրեք վիջեթը ձեր հեռախոսի հիմնական էկրանին։',
    homeScreenWidgetOpenPicker:
      'Բացեք ձեր հեռախոսի հիմնական էկրանի վիջեթների ընտրիչը և ընտրեք OptiSchedule Book։',
    homeScreenWidgetAddIos:
      'iPhone-ում՝ երկար սեղմեք հիմնական էկրանին → հպեք Ավելացնել (+) → փնտրեք OptiSchedule Book → ավելացրեք վիջեթը։',
    homeScreenWidgetAddAndroid:
      'Android-ում՝ երկար սեղմեք հիմնական էկրանին → Վիջեթներ → գտեք OptiSchedule Book → քաշեք այն ձեր հիմնական էկրան։',
    homeScreenWidgetAddGeneric:
      'iPhone-ում օգտագործեք Ավելացնել (+) վիջեթների պատկերասրահը, Android-ում՝ Վիջեթներ ընտրացանկը հիմնական էկրանին երկար սեղմելուց հետո։',
    homeScreenWidgetStaySignedIn:
      'Մնացեք մուտք գործած և բացեք Հաշիվը մեկ անգամ, որպեսզի հավելվածը համաժամեցնի ձեր հաջորդ այցը և արագ վերամրագրման կադրը։',
    homeScreenWidgetShowsTiles:
      'Վիջեթը ցույց է տալիս ձեր սրահի անունը, ինչպես նաև մինչև երկու սալիկ՝ Հաջորդ այց (widgetNextAppointment*) և Կրկին ամրագրել (widgetQuickRebook*)։',
    homeScreenWidgetTapBehavior:
      'Հպելով հաջորդ այցին՝ բացվում է Հաշիվը, հպելով Կրկին ամրագրելին՝ բացվում է ամրագրումը rebookSource=widget պարամետրով։',
    homeScreenWidgetSignedOutNote:
      'Դուք դուրս եք եկել համակարգից․ վիջեթը ցույց է տալիս մուտքի հրավեր՝ այցերի փոխարեն։',
    homeScreenWidgetNextApptWithSubtitle:
      'Ձեր կադրը ներառում է հաջորդ այց ({subtitle})։',
    homeScreenWidgetNextApptWithService:
      'Ձեր կադրը ներառում է հաջորդ այց {service}-ի համար։',
    homeScreenWidgetNextApptGeneric:
      'Ձեր կադրն այժմ ներառում է հաջորդ այց։',
    homeScreenWidgetQuickRebookAvailable:
      'Առաջիկա այց դեռ համաժամեցված չէ, սակայն արագ վերամրագրման սալիկը հասանելի է ձեր վերջին ավարտված ամրագրումից։',
    homeScreenWidgetAuthedNoData:
      'Դուք մուտք եք գործել, բայց առաջիկա այց կամ ավարտված վերամրագրման սալիկ դեռ համաժամեցված չէ․ բացեք Հաշիվը՝ ամրագրումները թարմացնելու համար։',
    homeScreenWidgetNextTileUsage:
      'Հաջորդ այցի սալիկն օգտագործում է widgetNextAppointmentTitle-ը և ցույց է տալիս ամենամոտ հաստատված կամ սպասման մեջ գտնվող ապագա ամրագրումը։',
    homeScreenWidgetNextTileBehavior:
      'Այն ցուցադրում է ծառայությունը, ամսաթիվը, ժամը և տրամադրողին, և հպելիս բացում է ձեր Հաշիվ ներդիրը։',
    homeScreenWidgetCurrentSnapshotService:
      'Ընթացիկ կադրի ծառայությունը՝ {service}։',
    homeScreenWidgetNoUpcomingSnapshot:
      'Վիջեթի կադրում այս պահին առաջիկա ամրագրում չկա։',
    homeScreenWidgetQuickRebookSource:
      '«Կրկին ամրագրել» վիջեթում գալիս է ձեր վերջին ավարտված այցից (widgetQuickRebook*)։',
    homeScreenWidgetQuickRebookDeepLink:
      'Այն ուղիղ անցում է կատարում ամրագրման դեպի նույն ծառայությունը՝ rebookSource=widget պարամետրով, որպեսզի կարողանաք արագ ընտրել նոր ժամ։',
    homeScreenWidgetQuickRebookShortcut:
      'Դա հապավում է․ նույնը չէ, ինչ օգնականին խնդրելը վերամրագրել ձեզ հավելվածի ներսում։',
    homeScreenWidgetSignedOutTiles:
      'Երբ դուրս եք եկել համակարգից, վիջեթը ցույց է տալիս widgetSignedOutTitle և widgetSignedOutSubtitle՝ սրահը բացելու հղումով։',
    homeScreenWidgetSignedOutSignIn:
      'Մուտք գործեք հաճախորդի հավելվածում և կրկին այցելեք Հաշիվ, որպեսզի վիջեթի կադրը ներառի ձեր այցերը։',
    homeScreenWidgetHowItWorksSnapshot:
      'Հավելվածը ձեր ամրագրումներից կառուցում է home_screen_widget_snapshot և համաժամեցնում է iOS WidgetKit / Android App Widget-ի հետ բնիկ հարթակներում։',
    homeScreenWidgetHowItWorksRefresh:
      'Հաշիվ և սրահի ներդիրները թարմացնում են կադրը, երբ ամրագրումները փոխվում են կամ հավելվածը վերադառնում է առաջին պլան։',
    homeScreenWidgetWebUnsupportedNote:
      'Վիջեթները պահանջում են տեղադրված բնիկ հավելված. դրանք հասանելի չեն վեբում։',
    // e2e-bug.299 — give_ai_feedback chip/summary labels.
    feedbackUpLabel: 'Օգտակար',
    feedbackDownLabel: 'Օգտակար չէ',
    feedbackThanks: 'Շնորհակալություն — սա օգնում է բարելավել օգնականին։',
    feedbackReasonWrongAction: 'Սխալ գործողություն',
    feedbackReasonWrongDate: 'Սխալ ամսաթիվ',
    feedbackReasonWrongPerson: 'Սխալ անձ',
    feedbackReasonWrongService: 'Սխալ ծառայություն',
    feedbackReasonDidNotUnderstand: 'Չհասկացա',
    feedbackReasonSkip: 'Բաց թողնել',
    feedbackDownChooseReason:
      'Օգտակար չէ — ընտրեք պատճառ, որպեսզի կարողանանք բարելավել օգնականին։',
    feedbackClarifyWhatWasWrong:
      'Ասեք՝ վերջին պատասխանը օգտակար էր, թե ինչն էր սխալ (օր. «Սխալ էր» կամ «Սխալ ամսաթիվ»)։',
    feedbackClarifyHelpfulOrNot:
      'Ասեք՝ պատասխանը օգտակար էր, թե ոչ (օր. «Օգտակար էր» կամ «Օգտակար չէ»)։',
    // e2e-bug.325 — give_provider_ai_feedback chip/summary labels.
    providerFeedbackUpLabel: 'Օգտակար',
    providerFeedbackDownLabel: 'Օգտակար չէ',
    providerFeedbackThanks:
      'Շնորհակալություն — սա օգնում է բարելավել մասնագետի օգնականին։',
    providerFeedbackReasonWrongAction: 'Սխալ գործողություն',
    providerFeedbackReasonWrongDate: 'Սխալ ամսաթիվ',
    providerFeedbackReasonWrongClient: 'Սխալ հաճախորդ',
    providerFeedbackReasonWrongService: 'Սխալ ծառայություն',
    providerFeedbackReasonDidNotUnderstand: 'Չհասկացա',
    providerFeedbackDownChooseReason:
      'Օգտակար չէ — ընտրեք պատճառ, որպեսզի կարողանանք բարելավել մասնագետի օգնականին։',
    providerFeedbackClarifyWhatWasWrong:
      'Ասեք՝ վերջին պատասխանը օգտակար էր, թե ինչն էր սխալ (օր. «Սխալ հաճախորդ ընտրվեց» կամ «Դա իմ մտադրությունը չէր»)։',
    providerFeedbackClarifyHelpfulOrNot:
      'Ասեք՝ պատասխանը օգտակար էր, թե ոչ (օր. «Օգտակար էր» կամ «Օգտակար չէ»)։',
    // e2e-bug.301 — explain_dashboard_only_action summaries.
    dashboardHandoffTemplate:
      '«{action}» հասանելի չէ բջջային օգնականից՝ {reason}։ Օգտագործեք վահանակը սրա համար։',
    dashboardHandoffFallback:
      'Այդ հնարավորությունը կառավարվում է վահանակից, ոչ թե բջջային օգնականից։ Բացեք վահանակը սրա համար։',
    dashboardHandoffActionTapCall: 'Հեռախոսով զանգել հաճախորդին',
    dashboardHandoffReasonTapCall:
      'Համակարգային tel: հղում — հաղորդագրությունների համար օգտագործեք send_client_message',
    dashboardHandoffActionIntake: 'Բացել ամբողջական ընդունելության պատասխանները',
    dashboardHandoffReasonIntake:
      'Կլինիկական/ընդունելության ադմինը և PHI վերանայումը վահանակի վեբում են',
    dashboardHandoffActionReview: 'Հաճախորդից վերանայում խնդրել',
    dashboardHandoffReasonReview:
      'Վերանայման հարցման քաղաքականությունը կարգավորվում է վահանակում',
    dashboardHandoffActionTemplates: 'Խմբագրել պատրաստի հաղորդագրության ձևանմուշները',
    dashboardHandoffReasonTemplates:
      'Ձևանմուշների կառավարումը բիզնեսի ադմին կարգավորում է վահանակի վեբում',
    dashboardHandoffActionLoyalty: 'Կարգավորել հավատարմության միավորները',
    dashboardHandoffReasonLoyalty:
      'Միավորների փոփոխությունները վահանակի CRM / ադմին AI-ով են միայն',
    dashboardHandoffActionLocale: 'Փոխել հավելվածի լեզուն (EN/HY/RU)',
    dashboardHandoffReasonLocale:
      'Լեզվի ընտրիչը հաճախորդի UI է — ոչ գործառնական AI մտադրություն',
    dashboardHandoffActionTimeOff: 'Հաստատել կամ մերժել արձակուրդի հարցումը',
    dashboardHandoffReasonTimeOff:
      'Մենեջերի հաստատումը կատարվում է վահանակից',
    // e2e-bug.327 — explain_reassign_limit / explain_time_off_approval summaries.
    reassignLimitReason:
      'Նույն օրվա վերանշանակումն օգտագործում է հատուկ մոբայլ API. AI-ի reschedule_booking-ը միայն ժամանակային միջակայքեր է տեղափոխում — բազմածառայության բարդ վերանշանակումը մնում է վահանակում',
    reassignLimitTemplate:
      '{reason}։ Օգտագործեք «Վերանշանակել» կոճակը ամրագրման վահանակի էջում բազմածառայության այցելությունների համար։',
    timeOffApprovalReason:
      'հաստատումը կատարվում է վահանակի approve_time_off_request / deny_time_off_request գործողություններով',
    timeOffApprovalTemplate:
      'Ձեր մենեջերը հաստատում կամ մերժում է արձակուրդի հարցումները — {reason}։ Կստանաք կարգավիճակի թարմացում (սպասման մեջ, հաստատված կամ մերժված), երբ նրանք վերանայեն։',
    // e2e-bug.328 — my_stats "Ձեր/Թիմի ցուցանիշները…" summary.
    myStatsScopeYour: 'Ձեր',
    myStatsScopeTeam: 'Թիմի',
    myStatsPeriodMonth: 'այս ամիս',
    myStatsPeriodWeek: 'այս շաբաթ',
    myStatsCompletedVisits: '{scope} ցուցանիշները {period}՝ {count} ավարտված {noun}',
    myStatsPaidRevenue: '{amount} վճարված եկամուտ',
    myStatsUtilization: '{percent}% ծանրաբեռնվածություն ({booked}/{scheduled} րոպե)',
    myStatsAvgReview: '{score}★ միջին գնահատական {count} նոր {noun}-ից',
    myStatsTips: '{amount} թեյավճար {count} {noun}-ից',
    myStatsVisitOne: 'այցելություն',
    myStatsVisitFew: 'այցելություն',
    myStatsVisitMany: 'այցելություն',
    myStatsReviewOne: 'կարծիք',
    myStatsReviewFew: 'կարծիք',
    myStatsReviewMany: 'կարծիք',
    // e2e-bug.302 — product-guide unmatched topic clarify.
    guideTopicMissClarify:
      'Դեռ չկարողացա գտնել համապատասխան ուղեցույցի թեմա։ Անվանեք էջը — Ժամանակացույց, Գործողություններ, AI հրամանների վահանակ — կամ բացեք Օգնություն և ուղեցույց կողային ընտրացանկից։',
    noSpecialists:
      'Այս պահին ամրագրման համար մասնագետներ չկան։ Խնդրում ենք կապվել բիզնեսի հետ։',
    specialistsHeader: 'Մեր մասնագետները՝',
    noUpcomingSlots: 'Ազատ slot-եր չկան',
    open: 'Ազատ',
    nextOn: 'Հաջորդը',
    nearestNeedsService:
      'Ո՞ր ծառայությունն եք ցանկանում ամրագրել։ Ասեք ծառայության անունը՝ մոտակա ազատ slot-ի համար։',
    noNearestSlot:
      'Հաջորդ երկու շաբաթվա ընթացքում {service}-ի համար ազատ slot{after} չկա։ Փորձեք այլ ծառայություն կամ կապվեք մեզ հետ։',
    availabilityNeedsDayOrService:
      'Ո՞ր օր կամ ծառայություն ստուգեմ։ Օրինակ՝ «Ազատ slot-եր երկուշաբթի և ուրբաթ massage-ի համար» կամ «Ե՞րբ է Gevorg-ը ազատ վաղը»։',
    availabilityNeedsDayForProvider:
      'Ո՞ր օրը ստուգեմ {name}-ի համար։ Օրինակ՝ «Ե՞րբ է {name}-ը ազատ վաղը» կամ «Արդյոք {name}-ը հասանելի է այս շաբաթ»։',
    availabilityNeedsDay:
      'Ո՞ր օրերն ենք ստուգում {service}-ի համար։ Կարող եք ասել երկուշաբթի և ուրբաթ, այս շաբաթ կամ վաղը։',
    availabilityServiceNotFound:
      '«{service}» ծառայությունը չգտա։ Հասանելի ծառայություններ՝ {available}։',
    availabilityProviderNotFound:
      '«{name}» մասնագետը չգտա։ Հասանելի մասնագետներ՝ {available}։',
    availabilityNoSlots:
      '{provider}-ի համար {service} ծառայության ազատ slot-եր չկան հարցված օր(եր)ին ({days})։ Փորձեք այլ օր կամ մասնագետ։',
    availabilityNoSlotsBudget:
      '{provider}-ի համար {service} ծառայության ազատ slot-եր չկան հարցված օր(եր)ին ({days}) ${maxPrice}-ից ցածր տարբերակներով։ Փորձեք այլ օր կամ մասնագետ։',
    availabilityHeader: '{service}-ի ազատ slot-եր ({days} օր)—',
    availabilityHeaderBudget:
      '{service}-ի ազատ slot-եր (${maxPrice}-ից ցածր տարբերակներ, {days} օր)—',
    availabilityHeaderOptions: '{service}-ի ազատ slot-եր ({count} տարբերակ)—',
    availabilityHeaderOptionsBudget:
      '{service}-ի ազատ slot-եր (${maxPrice}-ից ցածր տարբերակներ, {count} տարբերակ)—',
    availabilityDaySingleProvider: '{weekday} {date}՝ {times}',
    availabilityTimeOfDayMorning: 'առավոտ',
    availabilityTimeOfDayAfternoon: 'ցերեկ',
    availabilityTimeOfDayEvening: 'երեկո',
    availabilityWindowTomorrow: 'Վաղը {timeOfDay}',
    availabilityWindowTomorrowPlain: 'Վաղը',
    availabilityWindowToday: 'Այսօր {timeOfDay}',
    availabilityWindowTodayPlain: 'Այսօր',
    availabilityWindowWeekday: '{weekday} {timeOfDay}',
    availabilityWindowDate: '{date} {timeOfDay}',
    availabilityWindowNoSlots: '{label} ազատ slot-եր չկան։',
    availabilityNearestAlternative:
      'Ամենամոտ slot՝ {weekday} {date}, ժամը {time}, {provider}-ի հետ։',
    availabilityOverlapTomorrowIsWeekday:
      'Վաղը {weekday} է — երկու ժամային պատուհաններն նույն օրն են։',
    availabilityOverlapSameDay:
      'Տարբերակները նույն օրն են ({weekday}) — յուրաքանչյուր ժամային պատուհանը ստուգվում է առանձին։',
    anyService: 'ցանկացած ծառայություն',
    anySpecialist: 'ցանկացած մասնագետ',
    recommendNeedsService:
      'Ո՞ր ծառայության համար դասավորեմ մասնագետներին։ Հասանելի՝ {services}։',
    recommendHeader:
      'Լավագույն վարկանիշով մասնագետներ {service}-ի համար ({period})՝',
    recommendLine: '{rank}. {name}{role} — {rating}{service} — {date}՝ {times}',
    recommendNoReviews: 'Դեռ կարծիքներ չկան',
    recommendRating: '★ {rating} ({count} կարծիք)',
    recommendServiceNote: ' · {service}',
    recommendNoMatches:
      '{period} {service}-ի համար ազատ մասնագետներ չկան։ Փորձեք այլ օրեր կամ ծառայություններ։',
    recommendPeriodDays: '{count} օր',
  },
  booking: {
    emailOrPhoneRequired: 'Էլ. փոստ կամ հեռախոսահամար պարտադիր է',
    invalidCredentials: 'Սխալ մուտքի տվյալներ',
    emailRegistered: 'Էլ. փոստը արդեն գրանցված է',
  },
  email: {
    appointment: 'հանդիպում',
    appointments: 'հանդիպումներ',
    defaultServiceName: 'Հանդիպում',
    defaultProviderName: 'ձեր մասնագետը',
    defaultCustomerName: 'հարգելի',
    footerNote: 'Մինչ հանդիպումը!',
    reminderHours: '{count} ժամ',
    reminderMinutes: '{count} րոպե',
    reminderNow: 'հիմա',
    servicePriceLine: 'Գին՝ {price}',
    amountPaidLine: 'Վճարված է՝ {price}',
    receiptSubtotalLine: 'Ենթագումար՝ {price}',
    receiptTaxLine: '{name} ({rate}%)՝ {prefix}{price}',
    receiptTaxIncluded: 'ներառված',
    receiptTotalLine: 'Ընդամենը՝ {price}',
    taxRegistrationFooter: 'Հարկային գրանցում՝ {number}',
    giftCardBalanceLine: 'Մնացորդ՝ {price}',
    giftCardPurchaseLine: 'Վճարված է՝ {price}',
    appInstallPromoHeading: 'Ներբեռնեք OptiSchedule հավելվածը',
    appInstallPromoLinkLabel: 'Տեղադրեք կամ բացեք հավելվածը',
    appInstallPromoText:
      'OptiSchedule հավելվածը՝ հեշտ վերամրագրում և հիշեցումների համար՝ {url}',
    appInstallQrAlt: 'QR կոդ OptiSchedule հավելվածը տեղադրելու համար',
    clinicResultReadySubject:
      'Ձեր թեստ արդյունքները պատրաստ են — {businessName}',
    clinicResultReadyBody:
      'Ողջույն {customerName}, ձեր {testName} արդյունքները պատրաստ են ({whenLabel})։ {accountLine}',
    clinicResultReadySms:
      '{businessName}՝ {testName} արդյունքները պատրաստ են ({whenLabel})։ {accountLine}',
    clinicResultReadyWhatsappLabel: 'Արդյունքները պատրաստ են ({whenLabel})',
    clinicResultReadyAccountLink: 'Դիտել արդյունքները՝ {url}',
    clinicResultReadyPushTitle: '{businessName}՝ արդյունքները պատրաստ են',
    clinicResultReadyPushBody:
      'Ձեր {testName} արդյունքները պատրաստ են դիտելու համար։',
    clinicResultReadyPushForegroundHint:
      '{testName} արդյունքները պատրաստ են — հպեք դիտելու',
    clinicLabBookingRequestSubject:
      'Խնդրում ենք ամրագրել լաբորատորիայի այցը — {businessName}',
    clinicLabBookingRequestBody:
      'Ողջույն {customerName}, կլինիկան պատվիրել է {testNames}։ Ամրագրեք {collectionServiceName} այցը՝ {bookUrl}',
    clinicLabBookingRequestSms:
      '{businessName}. Ամրագրեք {collectionServiceName} ({testNames})՝ {bookUrl}',
    clinicLabBookingRequestWhatsapp:
      'Ամրագրեք {collectionServiceName} պատվիրած թեստերի համար ({testNames})',
    clinicLabBookingRequestPushTitle:
      '{businessName}՝ ամրագրեք լաբորատորիայի այցը',
    clinicLabBookingRequestPushBody:
      'Ամրագրեք {collectionServiceName} պատվիրած թեստերի համար ({testNames})։',
    clinicLabBookingRequestPushForegroundHint:
      '{collectionServiceName} — հպեք ամրագրելու',
    bookingConfirmedPushTitle: '{businessName}՝ ամրագրումը հաստատված է',
    bookingConfirmedPushBody:
      '{serviceName}՝ {scheduleLabel} — հպեք մանրամասները դիտելու',
    bookingConfirmedPushForegroundHint:
      'Հաստատված՝ {serviceName} {scheduleLabel}',
    bookingReminderPushTitle: '{businessName}՝ հիշեցում',
    bookingReminderPushBody: '{serviceName}՝ {scheduleLabel} — սպասում ենք ձեզ',
    bookingReminderPushForegroundHint:
      'Հիշեցում՝ {serviceName} {scheduleLabel}',
    bookingRescheduledPushTitle: '{businessName}՝ ամրագրումը տեղափոխված է',
    bookingRescheduledPushBody: '{serviceName} այժմ {scheduleLabel} է',
    bookingRescheduledPushForegroundHint:
      'Տեղափոխված է {scheduleLabel} — հպեք դիտելու',
    bookingCancelledPushTitle: '{businessName}՝ ամրագրումը չեղարկված է',
    bookingCancelledPushBody: '{serviceName} {scheduleLabel} չեղարկվել է',
    bookingCancelledPushForegroundHint:
      '{serviceName} չեղարկված է — հպեք վերամրագրելու',
    providerRunningLatePushTitle: '{businessName}՝ ուշացում',
    providerRunningLatePushBody:
      '{providerName}-ը մոտ {minutesLate} րոպե ուշ է {serviceName} համար',
    providerRunningLatePushForegroundHint:
      '{providerName}-ը {minutesLate} ր ուշ է',
    providerReadyNowPushTitle: '{businessName}՝ պատրաստ է',
    providerReadyNowPushBody: '{providerName}-ը պատրաստ է ձեր {serviceName}-ին',
    providerReadyNowPushForegroundHint: '{providerName}-ը պատրաստ է ձեզ',
    giftCardReceivedPushTitle: '{businessName}՝ նվեր քարտ',
    giftCardReceivedPushBody: 'Դուք նվեր քարտ եք ստացել {senderName}-ից',
    giftCardReceivedPushForegroundHint:
      'Նվեր քարտ {senderName}-ից — հպեք դիտելու',
    rebookingNudgePushTitle: '{businessName}՝ վերամրագրման ժամանակն է',
    rebookingNudgePushBody:
      'Ձեր հաջորդ {serviceName}-ի ժամանակն է ({cadenceLabel})։ Հպեք ամրագրելու',
    rebookingNudgePushForegroundHint: '{serviceName} — հպեք ամրագրելու',
    rebookingNudgeEmailSubject: 'Վերամրագրեք {serviceName} — {businessName}',
    rebookingNudgeMessage:
      'Ողջույն {customerName}, {businessName}-ում {serviceName} վերամրագրելու ժամանակն է։ {bookUrl}{promoLine}',
    winBackEmailSubject: 'Ցանկանում ենք նորից տեսնել ձեզ — {businessName}',
    winBackMessage:
      'Ողջույն {customerName}, կարոտում ենք ձեզ {businessName}-ում։ {bookUrl}{promoLine}{loyaltyLine}',
    winBackPromoLine: ' Օգտագործեք {promoCode} կոդը ամրագրելիս։',
    winBackLoyaltyLine: ' Ձեր հաշվին ավելացրել ենք ${bonusAmount} պարգևներ։',
    winBackPushTitle: '{businessName}՝ կարոտում ենք ձեզ',
    winBackPushBody:
      'Վաղուց չեք այցելել — ամրագրեք {businessName}-ում։{promoLine}',
    winBackPushForegroundHint: 'Հպեք {businessName}-ում ամրագրելու',
    activationConcierge24hEmailSubject:
      'Շարունակեք այնտեղ, որտեղ կանգնեցիք — {businessName}',
    activationConcierge24hMessage:
      'Ողջույն {customerName}, դուք սկսել էիք {serviceName} ամրագրել {businessName}-ում։ Շարունակեք մեկ հպումով՝ {bookUrl}',
    activationConcierge24hPushTitle: '{businessName}՝ ավարտեք ամրագրումը',
    activationConcierge24hPushBody:
      'Ձեր {serviceName} ամրագրումը սպասում է — հպեք շարունակելու',
    activationConcierge24hPushForegroundHint: 'Հպեք {serviceName} շարունակելու',
    activationConcierge72hEmailSubject:
      'Դեռ ցանկանո՞ւմ եք {serviceName} — {businessName}',
    activationConcierge72hMessage:
      'Ողջույն {customerName}, ձեր {serviceName} ամրագրումը {businessName}-ում դեռ պահված է։ Շարունակեք այստեղ՝ {bookUrl}',
    activationConcierge72hPushTitle: '{businessName}՝ ամրագրումը պահված է',
    activationConcierge72hPushBody:
      'Շարունակեք {serviceName} մեկ հպումով, մինչև ժամանակը լրանա',
    activationConcierge72hPushForegroundHint:
      'Մեկ հպումով շարունակել {serviceName}',
  },
  pdf: {
    clinicAfterVisitSummary: {
      title: 'Հետայցային ամփոփում',
      patientLabel: 'Հիվանդ՝',
      visitLabel: 'Այց՝',
      serviceLabel: 'Ծառայություն՝',
      providerLabel: 'Մասնագետ՝',
      summaryHeading: 'Ամփոփում',
      defaultProvider: 'Մասնագետ',
      defaultService: 'Խորհրդատվություն',
      printButton: 'Տպել / PDF',
    },
  },
  providerSuggestions: {
    confirmPendingTitle: '{count} ամրագրում պետք է հաստատվի',
    confirmPendingPrompt:
      'Ցույց տուր այսօրվա ամրագրումները, որոնք դեռ սպասում են հաստատման',
    unpaidTodayTitle: 'Այսօր {count} չվճարված ամրագրում',
    unpaidTodayPrompt:
      'Նշել այսօրվա բոլոր ավարտված ամրագրումները որպես վճարված',
    gapsTodayTitle: 'Այսօր կեսօրից հետո {count} ազատ slot',
    gapsTodayPrompt:
      'Ինչ կա իմ գրաֆիկում այսօր կեսօրից հետո։ Կա՞ն ազատ slot-եր',
    nextUpTitle: 'Հաջորդը՝ {customer} {time}-ին',
    nextUpPrompt:
      'Նշել {customer}-ի ամրագրումը {time}-ին որպես ավարտված և վճարված',
    emptyTodayTitle: 'Այսօր ամրագրումներ չկան',
    // e2e-bug.66 — must match summarize_day rescue (hy fixture).
    emptyTodayPrompt: 'Ինչպե՞ս է այսօրվա օրը',
    defaultClient: 'հաճախորդ',
  },
  clinic: {
    labState: {
      gate: {
        disabledReason:
          'Լաբորատոր պատվերները, արդյունքները և նմուշները հասանելի են միայն կլինիկական բիզնես տեսակների համար (clinic, polyclinic, beauty_clinic, dental)։',
      },
      order: {
        NotCollected: 'Չի հավաքվել',
        Collecting: 'Հավաքում',
        AwaitingResults: 'Սպասում է արդյունքներին',
        Completed: 'Ավարտված',
        Cancelled: 'Չեղարկված',
      },
      result: {
        NotReceived: 'Չի ստացվել',
        Pending: 'Սպասման մեջ',
        WaitingCompletion: 'Սպասում է ավարտին',
        Completed: 'Ավարտված',
        Reviewed: 'Վերանայված',
        AutomaticallyReviewed: 'Ավտոմատ վերանայված',
        Released: 'Հրապարակված',
        Rejected: 'Մերժված',
      },
      specimen: {
        NotCollected: 'Չի հավաքվել',
        Collected: 'Հավաքված',
        ReadyForTransport: 'Պատրաստ է փոխադրման',
        InTransit: 'Ճանապարհին',
        ReceivedInLab: 'Ստացվել է լաբորատորիայում',
        Completed: 'Ավարտված',
        RecollectRequired: 'Պահանջվում է կրկին հավաք',
        RetestRequired: 'Պահանջվում է կրկին թեստ',
        Rejected: 'Մերժված',
      },
      measurement: {
        Normal: 'Նորմալ',
        Abnormal: 'Աննորմալ',
        High: 'Բարձր',
        Low: 'Ցածր',
        Inconclusive: 'Անորոշելի',
        Indeterminate: 'Անորոշ',
        TestNotComplete: 'Թեստը ավարտված չէ',
        NotApplicable: 'Կիրառելի չէ',
        SeeDetails: 'Տես մանրամասները',
      },
      patientVisibility: {
        New: 'Նոր',
        Pending: 'Սպասման մեջ',
        Read: 'Կարդացված',
      },
    },
  },
};

const ru: MessageTree = {
  assistant: {
    unavailable:
      'Помощник по записи временно недоступен. Используйте шаги бронирования ниже.',
    unknown:
      'Не совсем понял. Спросите, кто свободен, какие услуги есть, или скажите: «Запиши массаж с Gevorg на завтра в 10:00».',
    helpPrompt:
      'Могу помочь найти специалиста, проверить время, показать услуги и цены или записать. Что вам нужно?',
    securityInjection:
      'Этот запрос пытается обойти правила системы. Я могу выполнять только разрешённые для вашей роли команды записи и расписания.',
    securityDataExport:
      'Массовый экспорт клиентов через ИИ недоступен. Запросите краткий рейтинг (например, «топ‑5 VIP клиентов») или используйте экспорт CRM в Настройках.',
    securityAvailabilityBypass:
      'Я не могу записать или перенести на недоступное время. Могу проверить свободные слоты или найти ближайшее время.',
    securityDefault: 'Эта команда недоступна по соображениям безопасности.',
    deniedPublic:
      'Это действие здесь недоступно. Переформулируйте запрос или воспользуйтесь шагами записи.',
    deniedCustomer:
      'Это действие недоступно в помощнике клиента. Переформулируйте запрос или воспользуйтесь меню записи.',
    // e2e-bug.126 — unknown-intent clarify lead sentence (per surface).
    unknownIntentProvider:
      'Не уверен, что вы имели в виду. Выберите один из вариантов или переформулируйте запрос.',
    unknownIntentCustomer:
      'Я не до конца понял. Что бы вы хотели сделать?',
    unknownIntentDashboard:
      'Я не до конца понял эту команду. Что из этого вы имели в виду?',
    // e2e-bug.239 — empty/blocked prompt action:error (customer gateway).
    requestError:
      'Не удалось понять этот запрос. Попробуйте переформулировать.',
    // e2e-bug.259 — guide support handoff chrome.
    guideStillStuck: 'Всё ещё не получается?',
    guideSupportTicketSubject: 'Помощь по гайду продукта{topic} ({surface})',
    guideSupportTicketBodyHeader:
      'Передача поддержки по гайду продукта (без PII)',
    guideSupportTicketBodyFooter:
      'Пользователь закончил встроенный гайд и всё ещё нужна помощь.',
    // e2e-bug.259 — explain_any_provider_option.
    anyProviderClarify:
      'Спросите, что значит «Любой специалист», назначат ли кого-то, или как выбрать любого специалиста на оформлении.',
    anyProviderMeaning:
      '«Любой доступный специалист» значит, что вы не выбираете мастера по имени заранее — мы подберём того, кто свободен для вашей услуги и времени.',
    anyProviderAssignment:
      'Если оставить «Любой специалист», салон назначит доступного специалиста при подтверждении записи; имя появится в подтверждении.',
    anyProviderPicker:
      'На оформлении нажмите строку специалиста, затем выберите «Любой доступный специалист» вверху списка или выберите по имени.',
    anyProviderTeamNote:
      ' В этом салоне {count} активных специалистов, которых можно подобрать.',
    anyProviderLabel: 'Любой доступный специалист',
    // e2e-bug.289 — list_tour_calendar_week empty/success/clarify (hy/ru).
    tourCalendarWeekEmpty:
      'На календарной неделе провайдера {weekLabel} нет подтверждённых выездов туров{providerNote}{filterNote}.',
    tourCalendarWeekSuccess:
      '{count} выезд(ов) тура на календарной неделе {weekLabel}{providerNote}{filterNote}: {entries}.',
    tourCalendarWeekClarify:
      'Попросите показать выезды туров на календарной неделе провайдера (например: «Покажи туры на этой неделе в календаре» или «Сводка туров Марии на неделе с pax»).',
    tourCalendarWeekProviderMissing:
      'Не удалось найти провайдера «{name}» для списка туров на календарной неделе.',
    tourCalendarWeekProviderNote: ' для {name}',
    tourCalendarWeekFilterNote: ' ({service})',
    tourCalendarWeekEntryPax: '{count} чел.',
    // e2e-bug.311 — explain_clinic_services empty/success/clarify (hy/ru).
    clinicServicesEmpty:
      'В каталоге клиники сейчас нет доступных услуг{filterNote}.',
    clinicServicesEmptyFilterNote: ' для «{service}»',
    clinicServicesStats:
      '{total} клинических услуг(и){filterNote}: {consultation} консультация, {labTest} лаб. тест, {procedure} процедура{unclassifiedNote}.',
    clinicServicesUnclassifiedNote: ', {count} без типа',
    clinicServicesDepartments: 'Отделения: {departments}.',
    clinicServicesFastingNone: 'Нет лабораторных тестов с требованием голодания.',
    clinicServicesFastingList: 'Требуется голодание: {names}.',
    clinicServicesClarify:
      'Спросите про услуги клинического каталога (например: «Объясни наши клинические услуги» или «Какие лабораторные тесты требуют голодания?»).',
    // e2e-bug.312 — create_service_category success (hy/ru), deterministic to avoid LLM-enrich flake.
    catalogCategoryCreated: 'Категория «{categoryName}» успешно создана.',
    catalogCategoryCreatedWithServices:
      'Категория «{categoryName}» успешно создана, с {count} пробной услугой(ями).',
    // e2e-bug.274 — confirm_my_booking_details.
    confirmBookingAnonClarify:
      'Завершите запись или войдите, чтобы я мог прочитать детали вашего визита из сессии.',
    confirmBookingSignedInMissing:
      'Не нашёл предстоящую запись для краткого обзора. Завершите оплату или выберите визит в аккаунте.',
    confirmBookingManageLinkClarify:
      'Сначала поделитесь ссылкой управления этой записью, чтобы я мог её найти.',
    // e2e-bug.276 — explain_home_screen_widget unrecognized-prompt clarify.
    homeScreenWidgetClarify:
      'Спросите про виджет главного экрана (например: «Добавить следующую запись на главный экран» или «Что показывает виджет»).',
    // e2e-bug.317 — explain_home_screen_widget success copy (hy/ru), deterministic to avoid LLM-enrich flake.
    homeScreenWidgetUnsupportedInstall:
      'Виджеты главного экрана доступны в нативных приложениях iOS и Android, а не в мобильном браузере.',
    homeScreenWidgetUnsupportedInstructions:
      'Установите OptiSchedule Book из магазина приложений, войдите в систему, затем добавьте виджет на главный экран телефона.',
    homeScreenWidgetOpenPicker:
      'Откройте выбор виджетов на главном экране телефона и выберите OptiSchedule Book.',
    homeScreenWidgetAddIos:
      'На iPhone: удерживайте главный экран → нажмите «Добавить» (+) → найдите OptiSchedule Book → добавьте виджет.',
    homeScreenWidgetAddAndroid:
      'На Android: удерживайте главный экран → Виджеты → найдите OptiSchedule Book → перетащите его на главный экран.',
    homeScreenWidgetAddGeneric:
      'На iPhone используйте галерею виджетов «Добавить» (+); на Android — меню «Виджеты» после удержания главного экрана.',
    homeScreenWidgetStaySignedIn:
      'Оставайтесь в системе и один раз откройте «Аккаунт», чтобы приложение синхронизировало ваш следующий визит и снимок быстрой повторной записи.',
    homeScreenWidgetShowsTiles:
      'Виджет показывает название салона и до двух плиток: «Следующая запись» (widgetNextAppointment*) и «Записаться снова» (widgetQuickRebook*).',
    homeScreenWidgetTapBehavior:
      'Нажатие на «Следующая запись» открывает «Аккаунт»; нажатие на «Записаться снова» открывает запись с rebookSource=widget.',
    homeScreenWidgetSignedOutNote:
      'Вы вышли из системы — виджет показывает приглашение войти вместо визитов.',
    homeScreenWidgetNextApptWithSubtitle:
      'Ваш снимок включает следующую запись ({subtitle}).',
    homeScreenWidgetNextApptWithService:
      'Ваш снимок включает следующую запись на {service}.',
    homeScreenWidgetNextApptGeneric:
      'Ваш снимок сейчас включает следующую запись.',
    homeScreenWidgetQuickRebookAvailable:
      'Предстоящий визит ещё не синхронизирован, но плитка быстрой повторной записи доступна на основе вашей последней завершённой записи.',
    homeScreenWidgetAuthedNoData:
      'Вы вошли в систему, но ни предстоящий визит, ни плитка повторной записи ещё не синхронизированы — откройте «Аккаунт», чтобы обновить записи.',
    homeScreenWidgetNextTileUsage:
      'Плитка «Следующая запись» использует widgetNextAppointmentTitle и показывает ближайшую подтверждённую или ожидающую запись.',
    homeScreenWidgetNextTileBehavior:
      'Она отображает услугу, дату, время и специалиста, а при нажатии открывает вкладку «Аккаунт».',
    homeScreenWidgetCurrentSnapshotService:
      'Услуга в текущем снимке: {service}.',
    homeScreenWidgetNoUpcomingSnapshot:
      'Сейчас в снимке виджета нет предстоящей записи.',
    homeScreenWidgetQuickRebookSource:
      '«Записаться снова» в виджете берётся из вашего последнего завершённого визита (widgetQuickRebook*).',
    homeScreenWidgetQuickRebookDeepLink:
      'Это открывает запись на ту же услугу с rebookSource=widget, чтобы вы могли быстро выбрать новое время.',
    homeScreenWidgetQuickRebookShortcut:
      'Это ярлык — не то же самое, что попросить ассистента записать вас повторно внутри приложения.',
    homeScreenWidgetSignedOutTiles:
      'Когда вы вышли из системы, виджет показывает widgetSignedOutTitle и widgetSignedOutSubtitle со ссылкой на открытие салона.',
    homeScreenWidgetSignedOutSignIn:
      'Войдите в клиентском приложении и снова откройте «Аккаунт», чтобы снимок виджета включал ваши визиты.',
    homeScreenWidgetHowItWorksSnapshot:
      'Приложение формирует home_screen_widget_snapshot на основе ваших записей и синхронизирует его с iOS WidgetKit / Android App Widget на нативных платформах.',
    homeScreenWidgetHowItWorksRefresh:
      'Вкладки «Аккаунт» и салона обновляют снимок при изменении записей или при возврате приложения на передний план.',
    homeScreenWidgetWebUnsupportedNote:
      'Виджеты требуют установленного нативного приложения — они недоступны в вебе.',
    // e2e-bug.299 — give_ai_feedback chip/summary labels.
    feedbackUpLabel: 'Полезно',
    feedbackDownLabel: 'Не полезно',
    feedbackThanks: 'Спасибо — это помогает улучшить помощника.',
    feedbackReasonWrongAction: 'Неверное действие',
    feedbackReasonWrongDate: 'Неверная дата',
    feedbackReasonWrongPerson: 'Неверный человек',
    feedbackReasonWrongService: 'Неверная услуга',
    feedbackReasonDidNotUnderstand: 'Не понял',
    feedbackReasonSkip: 'Пропустить',
    feedbackDownChooseReason:
      'Не полезно — выберите причину, чтобы мы могли улучшить помощника.',
    feedbackClarifyWhatWasWrong:
      'Скажите, был ли последний ответ полезен или что было не так (например: «Это было неправильно» или «Неверная дата»).',
    feedbackClarifyHelpfulOrNot:
      'Скажите, был ли ответ полезен (например: «Это было полезно» или «Не полезно»).',
    // e2e-bug.325 — give_provider_ai_feedback chip/summary labels.
    providerFeedbackUpLabel: 'Полезно',
    providerFeedbackDownLabel: 'Не полезно',
    providerFeedbackThanks:
      'Спасибо — это помогает улучшить ассистента провайдера.',
    providerFeedbackReasonWrongAction: 'Неверное действие',
    providerFeedbackReasonWrongDate: 'Неверная дата',
    providerFeedbackReasonWrongClient: 'Неверный клиент',
    providerFeedbackReasonWrongService: 'Неверная услуга',
    providerFeedbackReasonDidNotUnderstand: 'Не понял',
    providerFeedbackDownChooseReason:
      'Не полезно — выберите причину, чтобы мы могли улучшить ассистента.',
    providerFeedbackClarifyWhatWasWrong:
      'Скажите, был ли последний ответ полезен или что было не так (например: «Выбран неверный клиент» или «Это не было моим намерением»).',
    providerFeedbackClarifyHelpfulOrNot:
      'Скажите, был ли ответ полезен или нет (например: «Это было полезно» или «Не полезно»).',
    // e2e-bug.301 — explain_dashboard_only_action summaries.
    dashboardHandoffTemplate:
      '«{action}» недоступно в мобильном помощнике: {reason}. Используйте панель управления для этого.',
    dashboardHandoffFallback:
      'Эта функция управляется из панели, а не из мобильного помощника. Откройте панель для этого.',
    dashboardHandoffActionTapCall: 'Позвонить клиенту',
    dashboardHandoffReasonTapCall:
      'Системная tel: ссылка — сообщения через send_client_message',
    dashboardHandoffActionIntake: 'Открыть полные ответы анкеты',
    dashboardHandoffReasonIntake:
      'Клиническое/анкетное администрирование и PHI — в веб-панели',
    dashboardHandoffActionReview: 'Запросить отзыв у клиента',
    dashboardHandoffReasonReview:
      'Политика запросов отзывов настраивается в панели',
    dashboardHandoffActionTemplates: 'Редактировать шаблоны сообщений',
    dashboardHandoffReasonTemplates:
      'CRUD шаблонов — конфигурация админа в веб-панели',
    dashboardHandoffActionLoyalty: 'Изменить баллы лояльности',
    dashboardHandoffReasonLoyalty:
      'Корректировка баллов только через CRM / admin AI панели',
    dashboardHandoffActionLocale: 'Сменить язык приложения (EN/HY/RU)',
    dashboardHandoffReasonLocale:
      'Выбор языка — клиентский UI, не операционный AI-интент',
    dashboardHandoffActionTimeOff: 'Одобрить или отклонить отпуск',
    dashboardHandoffReasonTimeOff:
      'Одобрение менеджера выполняется в панели',
    // e2e-bug.327 — explain_reassign_limit / explain_time_off_approval summaries.
    reassignLimitReason:
      'Переназначение в тот же день использует отдельный мобильный API; ИИ reschedule_booking только переносит время — сложное переназначение мультиуслуги остаётся в панели',
    reassignLimitTemplate:
      '{reason}. Используйте кнопку «Переназначить» на странице бронирования в панели для мультиуслуг.',
    timeOffApprovalReason:
      'одобрение выполняется через действия approve_time_off_request / deny_time_off_request в панели',
    timeOffApprovalTemplate:
      'Ваш менеджер одобряет или отклоняет запросы на отпуск — {reason}. Вы увидите обновление статуса (в ожидании, одобрено или отклонено) после рассмотрения.',
    // e2e-bug.328 — my_stats "Ваша/Командная статистика…" summary.
    myStatsScopeYour: 'Ваша',
    myStatsScopeTeam: 'Командная',
    myStatsPeriodMonth: 'за этот месяц',
    myStatsPeriodWeek: 'за эту неделю',
    myStatsCompletedVisits: '{scope} статистика {period}: {count} завершённых {noun}',
    myStatsPaidRevenue: '{amount} оплаченного дохода',
    myStatsUtilization: 'загрузка {percent}% ({booked}/{scheduled} мин)',
    myStatsAvgReview: '{score}★ средняя оценка по {count} новым {noun}',
    myStatsTips: '{amount} чаевых за {count} {noun}',
    myStatsVisitOne: 'визит',
    myStatsVisitFew: 'визита',
    myStatsVisitMany: 'визитов',
    myStatsReviewOne: 'отзыв',
    myStatsReviewFew: 'отзыва',
    myStatsReviewMany: 'отзывов',
    // e2e-bug.302 — product-guide unmatched topic clarify.
    guideTopicMissClarify:
      'Пока не удалось подобрать тему гида. Назовите страницу — Расписание, Операции, панель команд AI — или откройте Справку и гид в боковом меню.',
    noSpecialists:
      'Сейчас нет доступных специалистов для записи. Свяжитесь с бизнесом напрямую.',
    specialistsHeader: 'Наши специалисты:',
    noUpcomingSlots: 'Нет свободных слотов',
    open: 'Свободно',
    nextOn: 'Ближайшее',
    nearestNeedsService:
      'Какую услугу записать? Назовите услугу для ближайшего свободного времени.',
    noNearestSlot:
      'Нет свободных слотов для {service}{after} в ближайшие две недели. Попробуйте другую услугу или свяжитесь с нами.',
    availabilityNeedsDayOrService:
      'На какой день или услугу проверить? Например: «Свободные слоты в понедельник и пятницу для массажа» или «Когда Gevorg свободен завтра?»',
    availabilityNeedsDayForProvider:
      'На какой день проверить для {name}? Например: «Когда {name} свободен завтра?» или «Доступен ли {name} на этой неделе?»',
    availabilityNeedsDay:
      'На какие дни проверить {service}? Можно сказать понедельник и пятницу, на этой неделе или завтра.',
    availabilityServiceNotFound:
      'Услуга «{service}» не найдена. Доступные услуги: {available}.',
    availabilityProviderNotFound:
      'Специалист «{name}» не найден. Доступные специалисты: {available}.',
    availabilityNoSlots:
      'Нет свободных слотов для {service} у {provider} в указанные дни ({days}). Попробуйте другой день или специалиста.',
    availabilityNoSlotsBudget:
      'Нет свободных слотов для {service} у {provider} в указанные дни ({days}) среди вариантов до ${maxPrice}. Попробуйте другой день или специалиста.',
    availabilityHeader: 'Свободные слоты для {service} ({days} дн.):',
    availabilityHeaderBudget:
      'Свободные слоты для {service} (варианты до ${maxPrice}) ({days} дн.):',
    availabilityHeaderOptions:
      'Свободные слоты для {service} ({count} вариантов):',
    availabilityHeaderOptionsBudget:
      'Свободные слоты для {service} (варианты до ${maxPrice}) ({count} вариантов):',
    availabilityDaySingleProvider: '{weekday} {date}: {times}',
    availabilityTimeOfDayMorning: 'утром',
    availabilityTimeOfDayAfternoon: 'днём',
    availabilityTimeOfDayEvening: 'вечером',
    availabilityWindowTomorrow: 'Завтра {timeOfDay}',
    availabilityWindowTomorrowPlain: 'Завтра',
    availabilityWindowToday: 'Сегодня {timeOfDay}',
    availabilityWindowTodayPlain: 'Сегодня',
    availabilityWindowWeekday: '{weekday} {timeOfDay}',
    availabilityWindowDate: '{date} {timeOfDay}',
    availabilityWindowNoSlots: 'Нет свободных слотов на {label}.',
    availabilityNearestAlternative:
      'Ближайшее окно: {weekday} {date} в {time} у {provider}.',
    availabilityOverlapTomorrowIsWeekday:
      'Завтра — {weekday}: это два временных окна в один и тот же день.',
    availabilityOverlapSameDay:
      'Варианты относятся к одному дню ({weekday}) — каждое окно проверяется отдельно.',
    anyService: 'любая услуга',
    anySpecialist: 'любой специалист',
    recommendNeedsService:
      'Для какой услуги подобрать специалистов? Доступно: {services}.',
    recommendHeader: 'Лучшие специалисты для {service} ({period}):',
    recommendLine: '{rank}. {name}{role} — {rating}{service} — {date}: {times}',
    recommendNoReviews: 'Пока нет отзывов',
    recommendRating: '★ {rating} ({count} отзывов)',
    recommendServiceNote: ' · {service}',
    recommendNoMatches:
      'Нет доступных специалистов для {service} на {period}. Попробуйте другие дни или услуги.',
    recommendPeriodDays: '{count} дн.',
  },
  booking: {
    emailOrPhoneRequired: 'Email или телефон обязателен',
    invalidCredentials: 'Неверные учётные данные',
    emailRegistered: 'Email уже зарегистрирован',
  },
  email: {
    appointment: 'запись',
    appointments: 'записи',
    defaultServiceName: 'Запись',
    defaultProviderName: 'ваш специалист',
    defaultCustomerName: 'здравствуйте',
    footerNote: 'До встречи!',
    reminderHours: '{count} ч',
    reminderMinutes: '{count} мин',
    reminderNow: 'сейчас',
    servicePriceLine: 'Цена: {price}',
    amountPaidLine: 'Оплачено: {price}',
    receiptSubtotalLine: 'Подытог: {price}',
    receiptTaxLine: '{name} ({rate}%): {prefix}{price}',
    receiptTaxIncluded: 'включено',
    receiptTotalLine: 'Итого: {price}',
    taxRegistrationFooter: 'Налоговый номер: {number}',
    giftCardBalanceLine: 'Баланс: {price}',
    giftCardPurchaseLine: 'Оплачено: {price}',
    appInstallPromoHeading: 'Скачайте приложение OptiSchedule',
    appInstallPromoLinkLabel:
      'Установить или открыть приложение для этого салона',
    appInstallPromoText:
      'Приложение OptiSchedule для быстрой повторной записи и напоминаний: {url}',
    appInstallQrAlt:
      'QR-код для установки приложения OptiSchedule для этого салона',
    clinicResultReadySubject:
      'Ваши результаты анализов готовы — {businessName}',
    clinicResultReadyBody:
      'Здравствуйте, {customerName}! Результаты {testName} готовы (выпущены {whenLabel}). {accountLine}',
    clinicResultReadySms:
      '{businessName}: результаты {testName} готовы ({whenLabel}). {accountLine}',
    clinicResultReadyWhatsappLabel: 'Результаты готовы ({whenLabel})',
    clinicResultReadyAccountLink: 'Смотреть результаты: {url}',
    clinicResultReadyPushTitle: '{businessName}: результаты готовы',
    clinicResultReadyPushBody: 'Результаты {testName} готовы к просмотру.',
    clinicResultReadyPushForegroundHint:
      'Результаты {testName} готовы — нажмите, чтобы открыть',
    clinicLabBookingRequestSubject:
      'Запишитесь на сдачу анализов — {businessName}',
    clinicLabBookingRequestBody:
      'Здравствуйте, {customerName}! Клиника назначила {testNames}. Запишитесь на {collectionServiceName}: {bookUrl}',
    clinicLabBookingRequestSms:
      '{businessName}: Запишитесь на {collectionServiceName} ({testNames}): {bookUrl}',
    clinicLabBookingRequestWhatsapp:
      'Запишитесь на {collectionServiceName} для назначенных анализов ({testNames})',
    clinicLabBookingRequestPushTitle:
      '{businessName}: запишитесь на сдачу анализов',
    clinicLabBookingRequestPushBody:
      'Запишитесь на {collectionServiceName} для назначенных анализов ({testNames}).',
    clinicLabBookingRequestPushForegroundHint:
      '{collectionServiceName} — нажмите, чтобы записаться',
    bookingConfirmedPushTitle: '{businessName}: Запись подтверждена',
    bookingConfirmedPushBody:
      '{serviceName} {scheduleLabel} — нажмите для деталей.',
    bookingConfirmedPushForegroundHint:
      'Подтверждено: {serviceName} {scheduleLabel}',
    bookingReminderPushTitle: '{businessName}: Напоминание о записи',
    bookingReminderPushBody: '{serviceName} {scheduleLabel} — ждём вас.',
    bookingReminderPushForegroundHint:
      'Напоминание: {serviceName} {scheduleLabel}',
    bookingRescheduledPushTitle: '{businessName}: Запись перенесена',
    bookingRescheduledPushBody: '{serviceName} теперь {scheduleLabel}.',
    bookingRescheduledPushForegroundHint:
      'Перенесено на {scheduleLabel} — нажмите для просмотра',
    bookingCancelledPushTitle: '{businessName}: Запись отменена',
    bookingCancelledPushBody: '{serviceName} {scheduleLabel} отменена.',
    bookingCancelledPushForegroundHint:
      '{serviceName} отменена — нажмите, чтобы записаться снова',
    providerRunningLatePushTitle: '{businessName}: Задержка',
    providerRunningLatePushBody:
      '{providerName} опаздывает примерно на {minutesLate} мин для {serviceName}.',
    providerRunningLatePushForegroundHint:
      '{providerName} опаздывает на {minutesLate} мин',
    providerReadyNowPushTitle: '{businessName}: Готовы принять',
    providerReadyNowPushBody: '{providerName} готов к вашему {serviceName}.',
    providerReadyNowPushForegroundHint: '{providerName} готов принять вас',
    giftCardReceivedPushTitle: '{businessName}: Подарочная карта',
    giftCardReceivedPushBody: 'Вы получили подарочную карту от {senderName}.',
    giftCardReceivedPushForegroundHint:
      'Подарочная карта от {senderName} — нажмите для просмотра',
    rebookingNudgePushTitle: '{businessName}: Пора записаться снова',
    rebookingNudgePushBody:
      'Пора записаться на {serviceName} ({cadenceLabel}). Нажмите, чтобы записаться.',
    rebookingNudgePushForegroundHint:
      'Пора на {serviceName} — нажмите, чтобы записаться',
    rebookingNudgeEmailSubject:
      'Пора записаться на {serviceName} — {businessName}',
    rebookingNudgeMessage:
      'Здравствуйте, {customerName}! Пора записаться на {serviceName} в {businessName}: {bookUrl}{promoLine}',
    winBackEmailSubject: 'Мы скучаем по вам — {businessName}',
    winBackMessage:
      'Здравствуйте, {customerName}! Мы скучаем по вам в {businessName}. Запишитесь: {bookUrl}{promoLine}{loyaltyLine}',
    winBackPromoLine: ' Используйте код {promoCode} при записи.',
    winBackLoyaltyLine: ' Мы начислили ${bonusAmount} бонусов на ваш счёт.',
    winBackPushTitle: '{businessName}: Мы скучаем по вам',
    winBackPushBody: 'Давно не были — запишитесь в {businessName}.{promoLine}',
    winBackPushForegroundHint: 'Нажмите, чтобы записаться в {businessName}',
  },
  pdf: {
    clinicAfterVisitSummary: {
      title: 'Сводка после визита',
      patientLabel: 'Пациент:',
      visitLabel: 'Визит:',
      serviceLabel: 'Услуга:',
      providerLabel: 'Специалист:',
      summaryHeading: 'Сводка',
      defaultProvider: 'Специалист',
      defaultService: 'Консультация',
      printButton: 'Печать / сохранить как PDF',
    },
  },
  providerSuggestions: {
    confirmPendingTitle: '{count} записей ждут подтверждения',
    confirmPendingPrompt:
      'Покажи записи на сегодня, которые ещё нужно подтвердить',
    unpaidTodayTitle: '{count} неоплаченных записей сегодня',
    unpaidTodayPrompt: 'Отметить все завершённые записи сегодня как оплаченные',
    gapsTodayTitle: '{count} свободных слотов сегодня днём',
    gapsTodayPrompt:
      'Что у меня в расписании сегодня днём? Есть свободные слоты?',
    nextUpTitle: 'Далее: {customer} в {time}',
    nextUpPrompt:
      'Отметить запись {customer} в {time} как завершённую и оплаченную',
    emptyTodayTitle: 'На сегодня записей нет',
    // e2e-bug.66 — must match summarize_day rescue (ru fixture).
    emptyTodayPrompt: 'Как проходит мой день?',
    defaultClient: 'клиент',
  },
  clinic: {
    labState: {
      gate: {
        disabledReason:
          'Лабораторные заказы, результаты и образцы доступны только для типов бизнеса клинической вертикали (clinic, polyclinic, beauty_clinic, dental).',
      },
      order: {
        NotCollected: 'Не собран',
        Collecting: 'Сбор',
        AwaitingResults: 'Ожидание результатов',
        Completed: 'Завершён',
        Cancelled: 'Отменён',
      },
      result: {
        NotReceived: 'Не получен',
        Pending: 'В ожидании',
        WaitingCompletion: 'Ожидание завершения',
        Completed: 'Завершён',
        Reviewed: 'Проверен',
        AutomaticallyReviewed: 'Проверен автоматически',
        Released: 'Опубликован',
        Rejected: 'Отклонён',
      },
      specimen: {
        NotCollected: 'Не собран',
        Collected: 'Собран',
        ReadyForTransport: 'Готов к транспортировке',
        InTransit: 'В пути',
        ReceivedInLab: 'Получен в лаборатории',
        Completed: 'Завершён',
        RecollectRequired: 'Требуется повторный забор',
        RetestRequired: 'Требуется повторный тест',
        Rejected: 'Отклонён',
      },
      measurement: {
        Normal: 'Норма',
        Abnormal: 'Отклонение',
        High: 'Выше нормы',
        Low: 'Ниже нормы',
        Inconclusive: 'Неоднозначно',
        Indeterminate: 'Неопределённо',
        TestNotComplete: 'Тест не завершён',
        NotApplicable: 'Не применимо',
        SeeDetails: 'Подробнее',
      },
      patientVisibility: {
        New: 'Новый',
        Pending: 'В ожидании',
        Read: 'Прочитано',
      },
    },
  },
};

const catalogs: Record<AppLocale, MessageTree> = { en, hy, ru };

function translate(messages: MessageTree, key: string): string {
  const parts = key.split('.');
  let cur: unknown = messages;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return key;
    cur = (cur as MessageTree)[part];
  }
  return typeof cur === 'string' ? cur : key;
}

export function t(
  locale: AppLocale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let text = translate(catalogs[locale] ?? catalogs.en, key);
  if (text === key && locale !== 'en') {
    text = translate(catalogs.en, key);
  }
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`,
  );
}
