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
    availabilityNeedsDay:
      'Which day should I check for {service}? You can say Monday and Friday, this week, or tomorrow.',
    availabilityServiceNotFound:
      'I couldn\'t find "{service}". Available services: {available}.',
    availabilityProviderNotFound:
      'I couldn\'t find "{name}". Available specialists: {available}.',
    availabilityNoSlots:
      'No open slots for {service} with {provider} on the requested day(s) ({days}). Try another day or specialist.',
    availabilityHeader: 'Open slots for {service} ({days} day(s)):',
    availabilityDaySingleProvider: '{weekday} {date}: {times}',
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
    clinicLabBookingRequestPushTitle:
      '{businessName}: Book lab collection',
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
    bookingReminderPushBody:
      '{serviceName} on {scheduleLabel} — see you soon.',
    bookingReminderPushForegroundHint:
      'Reminder: {serviceName} on {scheduleLabel}',
    bookingRescheduledPushTitle: '{businessName}: Appointment rescheduled',
    bookingRescheduledPushBody:
      '{serviceName} is now on {scheduleLabel}.',
    bookingRescheduledPushForegroundHint:
      'Rescheduled to {scheduleLabel} — tap to view',
    bookingCancelledPushTitle: '{businessName}: Appointment cancelled',
    bookingCancelledPushBody:
      '{serviceName} on {scheduleLabel} was cancelled.',
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
    giftCardReceivedPushBody:
      'You received a gift card from {senderName}.',
    giftCardReceivedPushForegroundHint:
      'Gift card from {senderName} — tap to view',
    rebookingNudgePushTitle: '{businessName}: Time to rebook',
    rebookingNudgePushBody:
      'Your next {serviceName} is due ({cadenceLabel}). Tap to book.',
    rebookingNudgePushForegroundHint:
      'Time for {serviceName} — tap to book',
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
    emptyTodayPrompt: 'Summarize my schedule for {date}',
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
    availabilityNeedsDay:
      'Ո՞ր օրերն ենք ստուգում {service}-ի համար։ Կարող եք ասել երկուշաբթի և ուրբաթ, այս շաբաթ կամ վաղը։',
    availabilityServiceNotFound:
      '«{service}» ծառայությունը չգտա։ Հասանելի ծառայություններ՝ {available}։',
    availabilityProviderNotFound:
      '«{name}» մասնագետը չգտա։ Հասանելի մասնագետներ՝ {available}։',
    availabilityNoSlots:
      '{provider}-ի համար {service} ծառայության ազատ slot-եր չկան հարցված օր(եր)ին ({days})։ Փորձեք այլ օր կամ մասնագետ։',
    availabilityHeader: '{service}-ի ազատ slot-եր ({days} օր)—',
    availabilityDaySingleProvider: '{weekday} {date}՝ {times}',
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
    bookingReminderPushBody:
      '{serviceName}՝ {scheduleLabel} — սպասում ենք ձեզ',
    bookingReminderPushForegroundHint:
      'Հիշեցում՝ {serviceName} {scheduleLabel}',
    bookingRescheduledPushTitle: '{businessName}՝ ամրագրումը տեղափոխված է',
    bookingRescheduledPushBody:
      '{serviceName} այժմ {scheduleLabel} է',
    bookingRescheduledPushForegroundHint:
      'Տեղափոխված է {scheduleLabel} — հպեք դիտելու',
    bookingCancelledPushTitle: '{businessName}՝ ամրագրումը չեղարկված է',
    bookingCancelledPushBody:
      '{serviceName} {scheduleLabel} չեղարկվել է',
    bookingCancelledPushForegroundHint:
      '{serviceName} չեղարկված է — հպեք վերամրագրելու',
    providerRunningLatePushTitle: '{businessName}՝ ուշացում',
    providerRunningLatePushBody:
      '{providerName}-ը մոտ {minutesLate} րոպե ուշ է {serviceName} համար',
    providerRunningLatePushForegroundHint:
      '{providerName}-ը {minutesLate} ր ուշ է',
    providerReadyNowPushTitle: '{businessName}՝ պատրաստ է',
    providerReadyNowPushBody:
      '{providerName}-ը պատրաստ է ձեր {serviceName}-ին',
    providerReadyNowPushForegroundHint: '{providerName}-ը պատրաստ է ձեզ',
    giftCardReceivedPushTitle: '{businessName}՝ նվեր քարտ',
    giftCardReceivedPushBody:
      'Դուք նվեր քարտ եք ստացել {senderName}-ից',
    giftCardReceivedPushForegroundHint:
      'Նվեր քարտ {senderName}-ից — հպեք դիտելու',
    rebookingNudgePushTitle: '{businessName}՝ վերամրագրման ժամանակն է',
    rebookingNudgePushBody:
      'Ձեր հաջորդ {serviceName}-ի ժամանակն է ({cadenceLabel})։ Հպեք ամրագրելու',
    rebookingNudgePushForegroundHint:
      '{serviceName} — հպեք ամրագրելու',
    rebookingNudgeEmailSubject:
      'Վերամրագրեք {serviceName} — {businessName}',
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
    emptyTodayPrompt: 'Ամփոփիր իմ գրաֆիկը {date} ամսաթվի համար',
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
    availabilityNeedsDay:
      'На какие дни проверить {service}? Можно сказать понедельник и пятницу, на этой неделе или завтра.',
    availabilityServiceNotFound:
      'Услуга «{service}» не найдена. Доступные услуги: {available}.',
    availabilityProviderNotFound:
      'Специалист «{name}» не найден. Доступные специалисты: {available}.',
    availabilityNoSlots:
      'Нет свободных слотов для {service} у {provider} в указанные дни ({days}). Попробуйте другой день или специалиста.',
    availabilityHeader: 'Свободные слоты для {service} ({days} дн.):',
    availabilityDaySingleProvider: '{weekday} {date}: {times}',
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
    appInstallPromoLinkLabel: 'Установить или открыть приложение для этого салона',
    appInstallPromoText:
      'Приложение OptiSchedule для быстрой повторной записи и напоминаний: {url}',
    appInstallQrAlt: 'QR-код для установки приложения OptiSchedule для этого салона',
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
    bookingReminderPushBody:
      '{serviceName} {scheduleLabel} — ждём вас.',
    bookingReminderPushForegroundHint:
      'Напоминание: {serviceName} {scheduleLabel}',
    bookingRescheduledPushTitle: '{businessName}: Запись перенесена',
    bookingRescheduledPushBody:
      '{serviceName} теперь {scheduleLabel}.',
    bookingRescheduledPushForegroundHint:
      'Перенесено на {scheduleLabel} — нажмите для просмотра',
    bookingCancelledPushTitle: '{businessName}: Запись отменена',
    bookingCancelledPushBody:
      '{serviceName} {scheduleLabel} отменена.',
    bookingCancelledPushForegroundHint:
      '{serviceName} отменена — нажмите, чтобы записаться снова',
    providerRunningLatePushTitle: '{businessName}: Задержка',
    providerRunningLatePushBody:
      '{providerName} опаздывает примерно на {minutesLate} мин для {serviceName}.',
    providerRunningLatePushForegroundHint:
      '{providerName} опаздывает на {minutesLate} мин',
    providerReadyNowPushTitle: '{businessName}: Готовы принять',
    providerReadyNowPushBody:
      '{providerName} готов к вашему {serviceName}.',
    providerReadyNowPushForegroundHint: '{providerName} готов принять вас',
    giftCardReceivedPushTitle: '{businessName}: Подарочная карта',
    giftCardReceivedPushBody:
      'Вы получили подарочную карту от {senderName}.',
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
    winBackPushBody:
      'Давно не были — запишитесь в {businessName}.{promoLine}',
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
    emptyTodayPrompt: 'Кратко опиши моё расписание на {date}',
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
