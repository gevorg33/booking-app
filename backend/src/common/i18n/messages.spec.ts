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
    'defines clinic after-visit summary PDF keys for %s',
    (locale) => {
      for (const key of CLINIC_AFTER_VISIT_SUMMARY_PDF_KEYS) {
        const value = t(locale, key);
        expect(value).not.toBe(key);
        expect(value.trim().length).toBeGreaterThan(0);
      }
    },
  );
});
