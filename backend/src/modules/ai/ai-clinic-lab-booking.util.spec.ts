import {
  AWAITING_PATIENT_BOOKING_LIST_PROMPTS,
  BOOK_LAB_COLLECTION_PROMPTS,
  CONSUMER_LAB_BOOKING_RESCUE_SCENARIOS,
  DASHBOARD_LAB_BOOKING_RESCUE_SCENARIOS,
  LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS,
  LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS,
  NOTIFY_PATIENT_BOOK_LAB_PROMPTS,
  PROVIDER_LAB_BOOKING_RESCUE_SCENARIOS,
  PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS,
  STAFF_BOOK_LAB_COLLECTION_PROMPTS,
} from './ai-clinic-lab-booking.fixtures.js';
import { BOOK_LAB_COLLECTION_NEAREST_PROMPTS } from './ai-book-lab-collection-nearest.fixtures.js';
import {
  isBookLabCollectionPrompt,
  isLabCollectionNearestCompoundPrompt,
  isListMyLabBookingRequestsPrompt,
  isListPatientPendingLabRequestsPrompt,
  isNotifyPatientBookLabPrompt,
  isPushLabBookingToPatientPrompt,
  isStaffBookLabCollectionPrompt,
  parseBookLabCollectionFromPrompt,
  parseListMyLabBookingRequestsFromPrompt,
  parsePushLabBookingFromPrompt,
  parseStaffBookLabCollectionFromPrompt,
  rescueConsumerClinicLabBookingIntent,
  rescueDashboardClinicLabBookingIntent,
  rescueProviderClinicLabBookingIntent,
} from './ai-clinic-lab-booking.util.js';

describe('ai-clinic-lab-booking.util', () => {
  it.each(PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS)(
    'detects push lab booking prompt $id',
    ({ prompt, customerName, orderId }) => {
      expect(isPushLabBookingToPatientPrompt(prompt)).toBe(true);
      const parsed = parsePushLabBookingFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (customerName) {
        expect(parsed?.customerName?.toLowerCase()).toContain(
          customerName.toLowerCase(),
        );
      }
      if (orderId) expect(parsed?.orderId).toBe(orderId);
    },
  );

  it.each(STAFF_BOOK_LAB_COLLECTION_PROMPTS)(
    'detects staff book lab collection prompt $id',
    ({ prompt, customerName, orderId }) => {
      expect(isStaffBookLabCollectionPrompt(prompt)).toBe(true);
      const parsed = parseStaffBookLabCollectionFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (customerName) {
        expect(parsed?.customerName?.toLowerCase()).toContain(
          customerName.toLowerCase(),
        );
      }
      if (orderId) expect(parsed?.orderId).toBe(orderId);
    },
  );

  it.each(LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS)(
    'detects list my lab booking requests prompt $id',
    ({ prompt }) => {
      expect(isListMyLabBookingRequestsPrompt(prompt)).toBe(true);
      expect(parseListMyLabBookingRequestsFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(BOOK_LAB_COLLECTION_PROMPTS)(
    'detects book lab collection prompt $id',
    ({ prompt }) => {
      expect(isBookLabCollectionPrompt(prompt)).toBe(true);
      expect(parseBookLabCollectionFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(BOOK_LAB_COLLECTION_NEAREST_PROMPTS)(
    'routes nearest compound away from plain list/book detectors $id',
    ({ prompt }) => {
      expect(isLabCollectionNearestCompoundPrompt(prompt)).toBe(true);
      expect(isListMyLabBookingRequestsPrompt(prompt)).toBe(false);
      expect(isBookLabCollectionPrompt(prompt)).toBe(false);
      expect(parseListMyLabBookingRequestsFromPrompt(prompt)).not.toBeNull();
      expect(parseBookLabCollectionFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS)(
    'detects provider pending lab requests prompt $id',
    ({ prompt }) => {
      expect(isListPatientPendingLabRequestsPrompt(prompt)).toBe(true);
    },
  );

  it.each(AWAITING_PATIENT_BOOKING_LIST_PROMPTS)(
    'does not classify awaiting-patient-booking list as push prompt $id',
    ({ prompt }) => {
      expect(isPushLabBookingToPatientPrompt(prompt)).toBe(false);
      expect(isStaffBookLabCollectionPrompt(prompt)).toBe(false);
    },
  );

  it.each(DASHBOARD_LAB_BOOKING_RESCUE_SCENARIOS)(
    'rescues dashboard misclassification for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueDashboardClinicLabBookingIntent(
        prompt,
        misclassifiedAction,
      );
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(CONSUMER_LAB_BOOKING_RESCUE_SCENARIOS)(
    'rescues consumer misclassification for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueConsumerClinicLabBookingIntent(
        prompt,
        misclassifiedAction,
      );
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(PROVIDER_LAB_BOOKING_RESCUE_SCENARIOS)(
    'rescues provider misclassification for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueProviderClinicLabBookingIntent(
        prompt,
        misclassifiedAction,
      );
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(NOTIFY_PATIENT_BOOK_LAB_PROMPTS)(
    'resolves notify_patient_book_lab on the provider surface for $id (ai-cmd-provider-5.19.4)',
    ({ prompt, customerName }) => {
      expect(isNotifyPatientBookLabPrompt(prompt)).toBe(true);
      const rescued = rescueProviderClinicLabBookingIntent(prompt, 'unknown');
      expect(rescued?.action).toBe('notify_patient_book_lab');
      if (customerName) {
        const parsed = parsePushLabBookingFromPrompt(prompt);
        expect(parsed?.customerName?.toLowerCase()).toContain(
          customerName.toLowerCase(),
        );
      }
    },
  );

  it('does not let isNotifyPatientBookLabPrompt steal dashboard push/send/notify phrasing', () => {
    expect(
      isNotifyPatientBookLabPrompt(
        'Push lab collection booking to Maria for her CBC order',
      ),
    ).toBe(false);
    expect(
      isNotifyPatientBookLabPrompt("Send Maria a link to book her blood draw"),
    ).toBe(false);
  });
});
