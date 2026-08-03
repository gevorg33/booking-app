import { resolveLocale, SUPPORTED_LOCALES, t } from './messages.js';

const CLINIC_LAB_BOOKING_REQUEST_KEYS = [
  'email.clinicLabBookingRequestSubject',
  'email.clinicLabBookingRequestBody',
  'email.clinicLabBookingRequestSms',
  'email.clinicLabBookingRequestWhatsapp',
  'email.clinicLabBookingRequestPushTitle',
  'email.clinicLabBookingRequestPushBody',
  'email.clinicLabBookingRequestPushForegroundHint',
] as const;

const CLINIC_RESULT_READY_NOTIFICATION_KEYS = [
  'email.clinicResultReadySubject',
  'email.clinicResultReadyBody',
  'email.clinicResultReadySms',
  'email.clinicResultReadyWhatsappLabel',
  'email.clinicResultReadyAccountLink',
  'email.clinicResultReadyPushTitle',
  'email.clinicResultReadyPushBody',
  'email.clinicResultReadyPushForegroundHint',
] as const;

const SALON_BOOKING_PUSH_KEYS = [
  'email.bookingConfirmedPushTitle',
  'email.bookingConfirmedPushBody',
  'email.bookingConfirmedPushForegroundHint',
  'email.bookingReminderPushTitle',
  'email.bookingReminderPushBody',
  'email.bookingReminderPushForegroundHint',
  'email.bookingRescheduledPushTitle',
  'email.bookingRescheduledPushBody',
  'email.bookingRescheduledPushForegroundHint',
  'email.bookingCancelledPushTitle',
  'email.bookingCancelledPushBody',
  'email.bookingCancelledPushForegroundHint',
  'email.giftCardReceivedPushTitle',
  'email.giftCardReceivedPushBody',
  'email.giftCardReceivedPushForegroundHint',
] as const;

const REBOOKING_NUDGE_KEYS = [
  'email.rebookingNudgePushTitle',
  'email.rebookingNudgePushBody',
  'email.rebookingNudgePushForegroundHint',
  'email.rebookingNudgeEmailSubject',
  'email.rebookingNudgeMessage',
  'email.winBackEmailSubject',
  'email.winBackMessage',
  'email.winBackPromoLine',
  'email.winBackLoyaltyLine',
  'email.winBackPushTitle',
  'email.winBackPushBody',
  'email.winBackPushForegroundHint',
  'email.activationConcierge24hEmailSubject',
  'email.activationConcierge24hMessage',
  'email.activationConcierge24hPushTitle',
  'email.activationConcierge24hPushBody',
  'email.activationConcierge24hPushForegroundHint',
  'email.activationConcierge72hEmailSubject',
  'email.activationConcierge72hMessage',
  'email.activationConcierge72hPushTitle',
  'email.activationConcierge72hPushBody',
  'email.activationConcierge72hPushForegroundHint',
] as const;

const CLINIC_AFTER_VISIT_SUMMARY_PDF_KEYS = [
  'pdf.clinicAfterVisitSummary.title',
  'pdf.clinicAfterVisitSummary.patientLabel',
  'pdf.clinicAfterVisitSummary.visitLabel',
  'pdf.clinicAfterVisitSummary.serviceLabel',
  'pdf.clinicAfterVisitSummary.providerLabel',
  'pdf.clinicAfterVisitSummary.summaryHeading',
  'pdf.clinicAfterVisitSummary.defaultProvider',
  'pdf.clinicAfterVisitSummary.defaultService',
  'pdf.clinicAfterVisitSummary.printButton',
] as const;

/** e2e-bug.127 — security_blocked / action-denied assistant copy */
const ASSISTANT_SECURITY_DENIED_KEYS = [
  'assistant.securityInjection',
  'assistant.securityDataExport',
  'assistant.securityAvailabilityBypass',
  'assistant.securityDefault',
  'assistant.deniedPublic',
  'assistant.deniedCustomer',
] as const;

/** e2e-bug.126 — unknown-intent clarify lead sentence */
const ASSISTANT_UNKNOWN_INTENT_KEYS = [
  'assistant.unknownIntentProvider',
  'assistant.unknownIntentCustomer',
  'assistant.unknownIntentDashboard',
] as const;

/** e2e-bug.239 — empty/blocked prompt action:error */
const ASSISTANT_REQUEST_ERROR_KEYS = ['assistant.requestError'] as const;

/** e2e-bug.259 / e2e-bug.274 — localized clarify + support handoff chrome */
const ASSISTANT_E2E259_KEYS = [
  'assistant.guideStillStuck',
  'assistant.guideSupportTicketSubject',
  'assistant.guideSupportTicketBodyHeader',
  'assistant.guideSupportTicketBodyFooter',
  'assistant.anyProviderClarify',
  'assistant.anyProviderMeaning',
  'assistant.confirmBookingAnonClarify',
  'assistant.confirmBookingManageLinkClarify',
  // e2e-bug.276
  'assistant.homeScreenWidgetClarify',
  // e2e-bug.299
  'assistant.feedbackUpLabel',
  'assistant.feedbackDownLabel',
  'assistant.feedbackThanks',
  'assistant.feedbackReasonWrongAction',
  'assistant.feedbackReasonWrongDate',
  'assistant.feedbackReasonWrongPerson',
  'assistant.feedbackReasonWrongService',
  'assistant.feedbackReasonDidNotUnderstand',
  'assistant.feedbackReasonSkip',
  'assistant.feedbackDownChooseReason',
  'assistant.feedbackClarifyWhatWasWrong',
  'assistant.feedbackClarifyHelpfulOrNot',
  // e2e-bug.301
  'assistant.dashboardHandoffTemplate',
  'assistant.dashboardHandoffFallback',
  'assistant.dashboardHandoffActionTapCall',
  'assistant.dashboardHandoffReasonTapCall',
  'assistant.dashboardHandoffActionIntake',
  'assistant.dashboardHandoffReasonIntake',
  'assistant.dashboardHandoffActionReview',
  'assistant.dashboardHandoffReasonReview',
  'assistant.dashboardHandoffActionTemplates',
  'assistant.dashboardHandoffReasonTemplates',
  'assistant.dashboardHandoffActionLoyalty',
  'assistant.dashboardHandoffReasonLoyalty',
  'assistant.dashboardHandoffActionLocale',
  'assistant.dashboardHandoffReasonLocale',
  'assistant.dashboardHandoffActionTimeOff',
  'assistant.dashboardHandoffReasonTimeOff',
  // e2e-bug.302
  'assistant.guideTopicMissClarify',
] as const;

describe('backend i18n messages', () => {
  it('resolves hy and ru locales', () => {
    expect(resolveLocale('hy')).toBe('hy');
    expect(resolveLocale('ru')).toBe('ru');
    expect(resolveLocale('de')).toBe('en');
  });

  it('translates email reminder windows per locale', () => {
    expect(t('en', 'email.reminderHours', { count: 6 })).toBe('6 hours');
    expect(t('hy', 'email.reminderHours', { count: 6 })).toBe('6 ժամ');
    expect(t('ru', 'email.reminderMinutes', { count: 30 })).toBe('30 мин');
  });

  it('falls back to English for missing keys in hy', () => {
    expect(t('hy', 'email.nonexistentKey')).toBe('email.nonexistentKey');
  });

  it.each(SUPPORTED_LOCALES)(
    'defines clinic lab booking request notification keys for %s',
    (locale) => {
      for (const key of CLINIC_LAB_BOOKING_REQUEST_KEYS) {
        const value = t(locale, key, {
          businessName: 'Clinic',
          customerName: 'Patient',
          testNames: 'CBC',
          collectionServiceName: 'Lab draw',
          bookUrl: 'https://example.com/book',
        });
        expect(value).not.toBe(key);
        expect(value.trim().length).toBeGreaterThan(0);
      }
    },
  );

  it.each(SUPPORTED_LOCALES)(
    'defines clinic result-ready notification keys for %s',
    (locale) => {
      for (const key of CLINIC_RESULT_READY_NOTIFICATION_KEYS) {
        const value = t(locale, key, {
          businessName: 'Clinic',
          customerName: 'Patient',
          testName: 'CBC',
          whenLabel: 'Jun 7, 2026',
          accountLine: 'View results: https://example.com/results',
          url: 'https://example.com/results',
        });
        expect(value).not.toBe(key);
        expect(value.trim().length).toBeGreaterThan(0);
      }
    },
  );

  it.each(SUPPORTED_LOCALES)(
    'defines salon booking push notification keys for %s',
    (locale) => {
      for (const key of SALON_BOOKING_PUSH_KEYS) {
        const value = t(locale, key, {
          businessName: 'Glow Nails',
          serviceName: 'Manicure',
          scheduleLabel: 'Mon Jun 8 at 2:00 PM',
          senderName: 'Alex',
        });
        expect(value).not.toBe(key);
        expect(value.trim().length).toBeGreaterThan(0);
      }
    },
  );

  it.each(SUPPORTED_LOCALES)(
    'defines rebooking nudge notification keys for %s',
    (locale) => {
      for (const key of REBOOKING_NUDGE_KEYS) {
        const value = t(locale, key, {
          businessName: 'Glow Nails',
          serviceName: 'Manicure',
          cadenceLabel: '6 weeks',
          customerName: 'Alex',
          bookUrl: 'https://example.com/book',
          promoLine: '',
        });
        expect(value).not.toBe(key);
        expect(value.trim().length).toBeGreaterThan(0);
      }
    },
  );

  it.each(SUPPORTED_LOCALES)(
    'defines clinic after-visit summary PDF keys for %s',
    (locale) => {
      for (const key of CLINIC_AFTER_VISIT_SUMMARY_PDF_KEYS) {
        const value = t(locale, key);
        expect(value).not.toBe(key);
        expect(value.trim().length).toBeGreaterThan(0);
      }
    },
  );

  it.each(SUPPORTED_LOCALES)(
    'defines assistant security denial keys for %s (e2e-bug.127)',
    (locale) => {
      for (const key of ASSISTANT_SECURITY_DENIED_KEYS) {
        const value = t(locale, key);
        expect(value).not.toBe(key);
        expect(value.trim().length).toBeGreaterThan(0);
        expect(value).not.toMatch(/create_booking|payment_sweep/);
      }
    },
  );

  it.each(SUPPORTED_LOCALES)(
    'defines assistant unknown-intent keys for %s (e2e-bug.126)',
    (locale) => {
      for (const key of ASSISTANT_UNKNOWN_INTENT_KEYS) {
        const value = t(locale, key);
        expect(value).not.toBe(key);
        expect(value.trim().length).toBeGreaterThan(0);
      }
      if (locale !== 'en') {
        expect(t(locale, 'assistant.unknownIntentCustomer')).not.toBe(
          t('en', 'assistant.unknownIntentCustomer'),
        );
      }
    },
  );

  it.each(SUPPORTED_LOCALES)(
    'defines assistant requestError key for %s (e2e-bug.239)',
    (locale) => {
      for (const key of ASSISTANT_REQUEST_ERROR_KEYS) {
        const value = t(locale, key);
        expect(value).not.toBe(key);
        expect(value.trim().length).toBeGreaterThan(0);
      }
      if (locale !== 'en') {
        expect(t(locale, 'assistant.requestError')).not.toBe(
          t('en', 'assistant.requestError'),
        );
      }
    },
  );

  it.each(SUPPORTED_LOCALES)(
    'defines e2e-bug.259/274 assistant clarify + handoff keys for %s',
    (locale) => {
      for (const key of ASSISTANT_E2E259_KEYS) {
        const value = t(locale, key, { topic: '', surface: 'public', count: '2' });
        expect(value).not.toBe(key);
        expect(value.trim().length).toBeGreaterThan(0);
      }
      if (locale !== 'en') {
        expect(t(locale, 'assistant.guideStillStuck')).not.toBe(
          t('en', 'assistant.guideStillStuck'),
        );
        expect(t(locale, 'assistant.anyProviderClarify')).not.toBe(
          t('en', 'assistant.anyProviderClarify'),
        );
        expect(t(locale, 'assistant.confirmBookingAnonClarify')).not.toBe(
          t('en', 'assistant.confirmBookingAnonClarify'),
        );
        // No mixed-script leftover like frontend's old "Դեռ stuck?".
        expect(t(locale, 'assistant.guideStillStuck')).not.toMatch(/stuck/i);
        // e2e-bug.299 — feedback chips must not stay English under hy/ru.
        expect(t(locale, 'assistant.feedbackUpLabel')).not.toBe(
          t('en', 'assistant.feedbackUpLabel'),
        );
        expect(t(locale, 'assistant.feedbackDownLabel')).not.toBe(
          t('en', 'assistant.feedbackDownLabel'),
        );
        expect(t(locale, 'assistant.feedbackDownChooseReason')).not.toMatch(
          /Not helpful/i,
        );
        // e2e-bug.301 — dashboard handoff template must not stay English under hy/ru.
        expect(t(locale, 'assistant.dashboardHandoffTemplate')).not.toBe(
          t('en', 'assistant.dashboardHandoffTemplate'),
        );
        expect(t(locale, 'assistant.dashboardHandoffActionTapCall')).not.toBe(
          t('en', 'assistant.dashboardHandoffActionTapCall'),
        );
        // e2e-bug.302 — guide topic-miss clarify must not stay English under hy/ru.
        expect(t(locale, 'assistant.guideTopicMissClarify')).not.toBe(
          t('en', 'assistant.guideTopicMissClarify'),
        );
        expect(t(locale, 'assistant.guideTopicMissClarify')).not.toMatch(
          /could not match that to a guide topic/i,
        );
      }
    },
  );
});
