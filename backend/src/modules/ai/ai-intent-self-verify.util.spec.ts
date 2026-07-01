import {
  APPLY_SELF_VERIFY_CORRECTION_SCENARIOS,
  SELF_VERIFY_BOOKING_VS_CLEAR_SCENARIOS,
  SELF_VERIFY_PIPE_MARKER,
  SELF_VERIFY_SCENARIOS,
  SELF_VERIFY_SCHEDULE_VOCAB_SCENARIOS,
  SELF_VERIFY_VOCAB_HELPER_SCENARIOS,
} from './ai-intent-self-verify.fixtures.js';
import {
  applySelfVerifyCorrection,
  checkBookingVsClearMismatch,
  checkScheduleVocabMismatch,
  hasBookingAppointmentVocabulary,
  hasScheduleMutationVocabulary,
  isDirectScheduleHoursPrompt,
  isWorkTimeSchedulePrompt,
  SELF_VERIFY_PIPE_MARKER as UTIL_MARKER,
  verifyIntentMatchesPrompt,
} from './ai-intent-self-verify.util.js';

describe('ai-intent-self-verify.util (pipe-1.6.1 / pipe-1.6.3)', () => {
  it('exports pipe marker', () => {
    expect(SELF_VERIFY_PIPE_MARKER).toBe('pipe-1.6.1');
    expect(UTIL_MARKER).toBe('pipe-1.6.1');
  });

  it.each(SELF_VERIFY_VOCAB_HELPER_SCENARIOS)(
    'vocabulary helpers $id',
    (scenario) => {
      expect(hasScheduleMutationVocabulary(scenario.prompt)).toBe(
        scenario.expectScheduleMutation,
      );
      expect(hasBookingAppointmentVocabulary(scenario.prompt)).toBe(
        scenario.expectBookingAppointment,
      );
      if (scenario.expectWorkTime !== undefined) {
        expect(isWorkTimeSchedulePrompt(scenario.prompt)).toBe(
          scenario.expectWorkTime,
        );
      }
      if (scenario.expectDirectSchedule !== undefined) {
        expect(isDirectScheduleHoursPrompt(scenario.prompt)).toBe(
          scenario.expectDirectSchedule,
        );
      }
    },
  );

  it.each(SELF_VERIFY_SCENARIOS)(
    'verifyIntentMatchesPrompt $id',
    (scenario) => {
      const result = verifyIntentMatchesPrompt(scenario.prompt, {
        action: scenario.action,
        params: {},
      });
      expect(result.passed).toBe(scenario.expectPassed);
      if (!scenario.expectPassed) {
        expect(result.ruleId).toBe(scenario.expectedRuleId);
        if (scenario.expectedCorrectedAction !== undefined) {
          expect(result.correctedAction).toBe(scenario.expectedCorrectedAction);
        } else {
          expect(result.correctedAction).toBeUndefined();
        }
      }
    },
  );

  it.each(SELF_VERIFY_BOOKING_VS_CLEAR_SCENARIOS)(
    'checkBookingVsClearMismatch $id',
    (scenario) => {
      const result = checkBookingVsClearMismatch(
        scenario.prompt,
        scenario.action,
      );
      expect(result.passed).toBe(scenario.expectPassed);
      if (!scenario.expectPassed) {
        expect(result.ruleId).toBe('booking_vs_clear_mismatch');
        expect(result.correctedAction).toBe(scenario.expectedCorrectedAction);
      }
    },
  );

  it.each(SELF_VERIFY_SCHEDULE_VOCAB_SCENARIOS)(
    'checkScheduleVocabMismatch $id',
    (scenario) => {
      const result = checkScheduleVocabMismatch(
        scenario.prompt,
        scenario.action,
      );
      expect(result.passed).toBe(scenario.expectPassed);
      if (!scenario.expectPassed) {
        expect(result.ruleId).toBe('schedule_vocab_mismatch');
        if (scenario.expectedCorrectedAction !== undefined) {
          expect(result.correctedAction).toBe(scenario.expectedCorrectedAction);
        } else {
          expect(result.correctedAction).toBeUndefined();
        }
      }
    },
  );

  it.each(APPLY_SELF_VERIFY_CORRECTION_SCENARIOS)(
    'applySelfVerifyCorrection $id',
    (scenario) => {
      const { intent, result } = applySelfVerifyCorrection(scenario.prompt, {
        action: scenario.workingAction,
        params: {},
        reasoning: 'classify',
        confidence: scenario.workingConfidence ?? 0.7,
      });
      expect(result.passed).toBe(scenario.expectPassed);
      expect(intent.action).toBe(scenario.expectIntentAction);
      if (scenario.expectedCorrectedAction !== undefined) {
        expect(result.correctedAction).toBe(scenario.expectedCorrectedAction);
      } else if (!scenario.expectPassed) {
        expect(result.correctedAction).toBeUndefined();
      }
    },
  );

  it('checkBookingVsClearMismatch flips hide/clear mislabels', () => {
    expect(
      checkBookingVsClearMismatch(
        'Hide done appointments from calendar this week',
        'clear_schedule',
      ).correctedAction,
    ).toBe('hide_appointments_from_calendar');
    expect(
      checkBookingVsClearMismatch(
        'Clear Karo schedule Friday',
        'create_booking',
      ).correctedAction,
    ).toBe('clear_schedule');
  });

  it('checkScheduleVocabMismatch maps work time to create_direct_schedule', () => {
    const result = checkScheduleVocabMismatch(
      'Create work time for Gevorg next 5 days',
      'create_booking',
    );
    expect(result.passed).toBe(false);
    expect(result.correctedAction).toBe('create_direct_schedule');
  });

  it('verifyIntentMatchesPrompt runs booking rule before schedule rule', () => {
    const result = verifyIntentMatchesPrompt(
      'Clear Gevorg schedule for tomorrow',
      {
        action: 'create_booking',
        params: {},
      },
    );
    expect(result.ruleId).toBe('booking_vs_clear_mismatch');
  });

  it('applySelfVerifyCorrection preserves params and confidence on correction', () => {
    const { intent } = applySelfVerifyCorrection(
      'Clear Gevorg schedule for tomorrow',
      {
        action: 'create_booking',
        params: { customerName: 'Anna' },
        reasoning: 'classify',
        confidence: 0.7,
      },
    );
    expect(intent.action).toBe('clear_schedule');
    expect(intent.params).toEqual({ customerName: 'Anna' });
    expect(intent.confidence).toBe(0.7);
  });

  it('applySelfVerifyCorrection sets reasoning when missing', () => {
    const { intent } = applySelfVerifyCorrection(
      'Clear Gevorg schedule for tomorrow',
      {
        action: 'create_booking',
        params: {},
        confidence: 0.7,
      },
    );
    expect(intent.reasoning).toContain(
      'Self-verify corrected to clear_schedule',
    );
  });
});
