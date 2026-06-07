import {
  AWAITING_PATIENT_BOOKING_LIST_PROMPTS,
  BOOK_LAB_COLLECTION_PROMPTS,
  CONSUMER_LAB_BOOKING_RESCUE_SCENARIOS,
  DASHBOARD_LAB_BOOKING_RESCUE_SCENARIOS,
  LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS,
  LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS,
  PROVIDER_LAB_BOOKING_RESCUE_SCENARIOS,
  PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS,
  STAFF_BOOK_LAB_COLLECTION_PROMPTS,
} from './ai-clinic-lab-booking.fixtures.js';
import {
  CLINIC_LAB_BOOKING_MULTILINGUAL_TRANSLATIONS,
  MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS,
  assertClinicLabBookingMultilingualParity,
} from './ai-clinic-lab-booking-multilingual.fixtures.js';
import {
  clinicLabBookingMultilingualScenarioToEvalCase,
  rescueClinicLabBookingSurfaceForEval,
} from './ai-clinic-lab-booking-multilingual.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  isBookLabCollectionPrompt,
  isListMyLabBookingRequestsPrompt,
  isListPatientPendingLabRequestsPrompt,
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

const MULTILINGUAL_PUSH = MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS.filter(
  (scenario) =>
    PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS.some(
      (entry) => entry.id === scenario.sourceScenarioId,
    ),
);
const MULTILINGUAL_STAFF_BOOK =
  MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS.filter((scenario) =>
    STAFF_BOOK_LAB_COLLECTION_PROMPTS.some(
      (entry) => entry.id === scenario.sourceScenarioId,
    ),
  );
const MULTILINGUAL_LIST_MY =
  MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS.filter((scenario) =>
    LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS.some(
      (entry) => entry.id === scenario.sourceScenarioId,
    ),
  );
const MULTILINGUAL_BOOK = MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS.filter(
  (scenario) =>
    BOOK_LAB_COLLECTION_PROMPTS.some(
      (entry) => entry.id === scenario.sourceScenarioId,
    ),
);
const MULTILINGUAL_PROVIDER =
  MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS.filter((scenario) =>
    LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS.some(
      (entry) => entry.id === scenario.sourceScenarioId,
    ),
  );
const MULTILINGUAL_AWAITING =
  MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS.filter((scenario) =>
    AWAITING_PATIENT_BOOKING_LIST_PROMPTS.some(
      (entry) => entry.id === scenario.sourceScenarioId,
    ),
  );
const MULTILINGUAL_DASHBOARD_RESCUE =
  MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS.filter((scenario) =>
    DASHBOARD_LAB_BOOKING_RESCUE_SCENARIOS.some(
      (entry) => entry.id === scenario.sourceScenarioId,
    ),
  );
const MULTILINGUAL_CONSUMER_RESCUE =
  MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS.filter((scenario) =>
    CONSUMER_LAB_BOOKING_RESCUE_SCENARIOS.some(
      (entry) => entry.id === scenario.sourceScenarioId,
    ),
  );
const MULTILINGUAL_PROVIDER_RESCUE =
  MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS.filter((scenario) =>
    PROVIDER_LAB_BOOKING_RESCUE_SCENARIOS.some(
      (entry) => entry.id === scenario.sourceScenarioId,
    ),
  );

describe('ai-clinic-lab-booking-multilingual (i18n-clinic-v2-ai-8)', () => {
  it('has HY/RU parity for every clinic lab booking scenario', () => {
    const counts = assertClinicLabBookingMultilingualParity();
    expect(counts.push).toBe(22);
    expect(counts.staffBook).toBe(20);
    expect(counts.listMy).toBe(24);
    expect(counts.bookCollection).toBe(24);
    expect(counts.providerPending).toBe(22);
    expect(counts.awaiting).toBe(10);
    expect(counts.rescue).toBe(14);
    expect(MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS.length).toBe(136);
  });

  it.each(MULTILINGUAL_PUSH)(
    'detects $locale push lab booking $sourceScenarioId',
    ({ prompt }) => {
      expect(isPushLabBookingToPatientPrompt(prompt)).toBe(true);
      expect(parsePushLabBookingFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(MULTILINGUAL_STAFF_BOOK)(
    'detects $locale staff book lab collection $sourceScenarioId',
    ({ prompt }) => {
      expect(isStaffBookLabCollectionPrompt(prompt)).toBe(true);
      expect(parseStaffBookLabCollectionFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(MULTILINGUAL_LIST_MY)(
    'detects $locale list my lab booking requests $sourceScenarioId',
    ({ prompt }) => {
      expect(isListMyLabBookingRequestsPrompt(prompt)).toBe(true);
      expect(parseListMyLabBookingRequestsFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(MULTILINGUAL_BOOK)(
    'detects $locale book lab collection $sourceScenarioId',
    ({ prompt }) => {
      expect(isBookLabCollectionPrompt(prompt)).toBe(true);
      expect(parseBookLabCollectionFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(MULTILINGUAL_PROVIDER)(
    'detects $locale provider pending lab requests $sourceScenarioId',
    ({ prompt }) => {
      expect(isListPatientPendingLabRequestsPrompt(prompt)).toBe(true);
    },
  );

  it.each(MULTILINGUAL_AWAITING)(
    'does not classify awaiting-patient-booking list as push/staff $locale $sourceScenarioId',
    ({ prompt }) => {
      expect(isPushLabBookingToPatientPrompt(prompt)).toBe(false);
      expect(isStaffBookLabCollectionPrompt(prompt)).toBe(false);
    },
  );

  it.each(MULTILINGUAL_DASHBOARD_RESCUE)(
    'rescues dashboard $locale misclassification $sourceScenarioId',
    ({ prompt, rescueFromAction, expectedAction }) => {
      const rescued = rescueDashboardClinicLabBookingIntent(
        prompt,
        rescueFromAction!,
      );
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(MULTILINGUAL_CONSUMER_RESCUE)(
    'rescues consumer $locale misclassification $sourceScenarioId',
    ({ prompt, rescueFromAction, expectedAction }) => {
      const rescued = rescueConsumerClinicLabBookingIntent(
        prompt,
        rescueFromAction!,
      );
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(MULTILINGUAL_PROVIDER_RESCUE)(
    'rescues provider $locale misclassification $sourceScenarioId',
    ({ prompt, rescueFromAction, expectedAction }) => {
      const rescued = rescueProviderClinicLabBookingIntent(
        prompt,
        rescueFromAction!,
      );
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it('rescues dashboard awaiting patient booking via surface eval helper', () => {
    const scenario = MULTILINGUAL_AWAITING.find(
      (entry) =>
        entry.sourceScenarioId === 'pushed-not-booked' && entry.locale === 'hy',
    )!;
    const rescued = rescueClinicLabBookingSurfaceForEval(
      scenario.prompt,
      'unknown',
      'dashboard',
    );
    expect(rescued?.action).toBe('list_test_orders');
    expect(rescued?.params.awaitingPatientBooking).toBe(true);
  });

  it('passes deterministic eval for every multilingual scenario', () => {
    const failures = MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS.map(
      (scenario) => clinicLabBookingMultilingualScenarioToEvalCase(scenario),
    )
      .map((evalCase) => ({
        id: evalCase.id,
        result: evaluateDeterministicEvalCase(evalCase),
      }))
      .filter(({ result }) => !result.passed);
    expect(
      failures.map(({ id, result }) => ({ id, errors: result.errors })),
    ).toEqual([]);
  });

  it('maps multilingual scenarios to eval cases', () => {
    const scenario = MULTILINGUAL_PUSH.find(
      (entry) =>
        entry.sourceScenarioId === 'push-maria-cbc' && entry.locale === 'hy',
    )!;
    const evalCase = clinicLabBookingMultilingualScenarioToEvalCase(scenario);
    expect(evalCase.expect.rescuedAction).toBe('push_lab_booking_to_patient');
    expect(evalCase.expect.paramsPartial?.customerName).toBe('Մարիա');
    expect(evalCase.expect.needsMultilingual).toBe(true);
  });

  it('keeps english customer names when locale is en', () => {
    const evalCase = clinicLabBookingMultilingualScenarioToEvalCase({
      id: 'push-maria-cbc-en',
      sourceScenarioId: 'push-maria-cbc',
      locale: 'en',
      surface: 'dashboard',
      prompt: 'Push lab collection booking to Maria',
      expectedAction: 'push_lab_booking_to_patient',
      paramsPartial: { customerName: 'Maria' },
      needsMultilingual: true,
    });
    expect(evalCase.expect.paramsPartial?.customerName).toBe('Maria');
  });

  it('throws when multilingual parity is missing', () => {
    const original = { ...CLINIC_LAB_BOOKING_MULTILINGUAL_TRANSLATIONS };
    delete (
      CLINIC_LAB_BOOKING_MULTILINGUAL_TRANSLATIONS as Record<string, unknown>
    )['push-maria-cbc'];
    expect(() => assertClinicLabBookingMultilingualParity()).toThrow(
      /Clinic lab booking multilingual parity missing/,
    );
    Object.assign(CLINIC_LAB_BOOKING_MULTILINGUAL_TRANSLATIONS, original);
  });
});
