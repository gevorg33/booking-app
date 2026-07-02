import {
  BOOKING_CHECKOUT_DRAFT_TTL_MINUTES,
  CUSTOMER_PUBLIC_EXPLAIN_SLOT_NO_LONGER_AVAILABLE_CLASSIFIER_RULES,
  buildAvailabilityRefreshParams,
  buildExplainSlotNoLongerAvailableNavigate,
  buildSlotNoLongerAvailableExplanation,
  isExplainSlotNoLongerAvailablePrompt,
  parseExplainSlotNoLongerAvailableFromPrompt,
  parseSlotNoLongerAvailableAspect,
  rescueExplainSlotNoLongerAvailableIntent,
} from './ai-explain-slot-no-longer-available.util.js';
import {
  EXPLAIN_SLOT_NO_LONGER_AVAILABLE_PROMPTS,
  EXPLAIN_SLOT_NO_LONGER_AVAILABLE_RESCUE_SCENARIOS,
} from './ai-explain-slot-no-longer-available.fixtures.js';
import { EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_SCENARIOS } from './ai-explain-slot-no-longer-available-multilingual.fixtures.js';
import { isFixCheckoutValidationErrorPrompt } from './ai-fix-checkout-validation-error.util.js';
import { isConsumerDiagnoseStripeCheckoutFailurePrompt } from './ai-diagnose-stripe-checkout-failure.util.js';
import { isFindSoonestAppointmentPrompt } from './ai-find-soonest-appointment.util.js';

describe('ai-explain-slot-no-longer-available.util', () => {
  it('exports classifier rules for explain_slot_no_longer_available', () => {
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_SLOT_NO_LONGER_AVAILABLE_CLASSIFIER_RULES,
    ).toContain('explain_slot_no_longer_available');
    expect(BOOKING_CHECKOUT_DRAFT_TTL_MINUTES).toBe(30);
  });

  it.each(
    EXPLAIN_SLOT_NO_LONGER_AVAILABLE_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects explain slot prompt for $id', (_id, row) => {
    expect(isExplainSlotNoLongerAvailablePrompt(row.prompt)).toBe(true);
    expect(parseExplainSlotNoLongerAvailableFromPrompt(row.prompt)).toEqual({
      aspect: expect.any(String),
    });
    expect(
      rescueExplainSlotNoLongerAvailableIntent(row.prompt, 'unknown'),
    ).toEqual({
      action: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    });
  });

  it.each(
    EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain slot prompt for $id', (_id, row) => {
    expect(isExplainSlotNoLongerAvailablePrompt(row.prompt)).toBe(true);
    expect(
      rescueExplainSlotNoLongerAvailableIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_slot_no_longer_available');
  });

  it.each(
    EXPLAIN_SLOT_NO_LONGER_AVAILABLE_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues $id from misclassified action', (_id, row) => {
    expect(
      rescueExplainSlotNoLongerAvailableIntent(
        row.prompt,
        row.misclassifiedAction,
      ),
    ).toEqual({
      action: row.expectedAction,
      rescueReason: 'explain_slot_no_longer_available',
    });
  });

  it('steals from fix_checkout_validation_error and payment diagnostics', () => {
    expect(isFixCheckoutValidationErrorPrompt('That time disappeared')).toBe(
      false,
    );
    expect(
      isConsumerDiagnoseStripeCheckoutFailurePrompt('Someone took my slot'),
    ).toBe(false);
    expect(isFindSoonestAppointmentPrompt('Someone took my slot')).toBe(false);
  });

  it('does not match plain availability browse without gone/taken cue', () => {
    expect(
      isExplainSlotNoLongerAvailablePrompt('Check availability tomorrow'),
    ).toBe(false);
    expect(isExplainSlotNoLongerAvailablePrompt('Who is free on Friday?')).toBe(
      false,
    );
  });

  it('parses aspects from prompt phrasing', () => {
    expect(parseSlotNoLongerAvailableAspect('Someone took my slot')).toBe(
      'taken_by_someone',
    );
    expect(parseSlotNoLongerAvailableAspect('That time disappeared')).toBe(
      'disappeared',
    );
    expect(
      parseSlotNoLongerAvailableAspect('My checkout payment hold expired'),
    ).toBe('checkout_hold_expired');
  });

  it('builds explanation copy with checkout TTL', () => {
    const explanation =
      buildSlotNoLongerAvailableExplanation('taken_by_someone');
    expect(explanation.likelyCauses.join(' ')).toContain('30 minutes');
    expect(explanation.nextSteps.length).toBeGreaterThan(0);
  });

  it('builds availability refresh params from session context', () => {
    expect(
      buildAvailabilityRefreshParams({
        serviceId: 'svc-1',
        date: '2026-06-30',
        employeeId: 'emp-1',
        startTime: '14:00',
      }),
    ).toEqual({
      serviceId: 'svc-1',
      date: '2026-06-30',
      employeeId: 'emp-1',
      startTime: '14:00',
    });
  });

  it('builds navigate payload for fresh booking', () => {
    expect(
      buildExplainSlotNoLongerAvailableNavigate({
        serviceId: 'svc-1',
        date: '2026-06-30',
        startTime: '14:00',
        employeeId: 'emp-1',
      }),
    ).toEqual({
      path: 'checkout',
      query: {
        serviceId: 'svc-1',
        date: '2026-06-30',
        startTime: '14:00',
        employeeId: 'emp-1',
        freshBook: '1',
      },
    });
  });
});
