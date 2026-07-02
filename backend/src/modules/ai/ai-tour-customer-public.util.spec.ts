import {
  CUSTOMER_PUBLIC_TOUR_CLASSIFIER_RULES,
  TOUR_CUSTOMER_PUBLIC_PROMPTS,
  detectTourCustomerPublicAction,
  enrichTourCustomerPublicParamsFromPrompt,
  isDiagnoseTourCapacityPrompt,
  isExplainTourBookingPrompt,
  isExplainTourDaySlotsPrompt,
  isExplainTourBookingRecordPrompt,
  rescueTourCustomerPublicIntent,
} from './ai-tour-customer-public.util.js';
import { isExplainTourMeetingPointPrompt } from './ai-tour-meeting-point.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_TOUR_BOOKING_CASES } from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_EXPLAIN_TOUR_DAY_SLOTS_CASES } from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_DIAGNOSE_TOUR_CAPACITY_CASES } from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_EXPLAIN_TOUR_BOOKING_RECORD_CUSTOMER_CASES } from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_EXPLAIN_TOUR_MEETING_POINT_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-tour-customer-public.util (ai-cmd-customer-4.0 P3)', () => {
  it('exports classifier rules for tour booking, day slots, and capacity', () => {
    expect(CUSTOMER_PUBLIC_TOUR_CLASSIFIER_RULES).toContain(
      'explain_tour_booking',
    );
    expect(CUSTOMER_PUBLIC_TOUR_CLASSIFIER_RULES).toContain(
      'explain_tour_day_slots',
    );
    expect(CUSTOMER_PUBLIC_TOUR_CLASSIFIER_RULES).toContain(
      'diagnose_tour_capacity',
    );
    expect(CUSTOMER_PUBLIC_TOUR_CLASSIFIER_RULES).toContain(
      'explain_tour_booking_record',
    );
    expect(CUSTOMER_PUBLIC_TOUR_CLASSIFIER_RULES).toContain(
      'explain_tour_meeting_point',
    );
  });

  it.each(TOUR_CUSTOMER_PUBLIC_PROMPTS.map((row) => [row.id, row] as const))(
    'detects tour customer/public prompt $id',
    (_id, row) => {
      expect(detectTourCustomerPublicAction(row.prompt)).toBe(
        row.expectedAction,
      );
      if (row.expectedAction === 'explain_tour_booking') {
        expect(isExplainTourBookingPrompt(row.prompt)).toBe(true);
      } else if (row.expectedAction === 'explain_tour_day_slots') {
        expect(isExplainTourDaySlotsPrompt(row.prompt)).toBe(true);
      } else if (row.expectedAction === 'explain_tour_booking_record') {
        expect(isExplainTourBookingRecordPrompt(row.prompt)).toBe(true);
      } else if (row.expectedAction === 'explain_tour_meeting_point') {
        expect(isExplainTourMeetingPointPrompt(row.prompt)).toBe(true);
      } else {
        expect(isDiagnoseTourCapacityPrompt(row.prompt)).toBe(true);
      }
    },
  );

  it.each(TOUR_CUSTOMER_PUBLIC_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues tour customer/public prompt $id from unknown',
    (_id, row) => {
      const rescued = rescueTourCustomerPublicIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
      expect(rescued?.rescueReason).toBe(row.rescueReason);
    },
  );

  it('enriches tour params from prompt', () => {
    expect(
      enrichTourCustomerPublicParamsFromPrompt(
        {},
        'How many spots are left on 15/08/2026 for Mountain Trek?',
        'explain_tour_day_slots',
      ),
    ).toMatchObject({
      serviceName: expect.any(String),
      date: '2026-08-15',
    });
    expect(
      enrichTourCustomerPublicParamsFromPrompt(
        {},
        "Why can't I book 4 people for City Tour?",
        'diagnose_tour_capacity',
      ),
    ).toMatchObject({
      requestedPax: 4,
    });
    expect(
      enrichTourCustomerPublicParamsFromPrompt(
        {},
        'What time should I arrive for my Mountain Trek?',
        'explain_tour_meeting_point',
      ),
    ).toMatchObject({
      serviceName: 'Mountain Trek',
      aspect: 'arrival_time',
    });
  });

  it('does not steal admin tour catalog or availability listing prompts', () => {
    expect(
      detectTourCustomerPublicAction('List all tour services for this salon'),
    ).toBeNull();
    expect(
      detectTourCustomerPublicAction('Who is free for a haircut tomorrow?'),
    ).toBeNull();
  });

  it('maps tour customer/public fixtures to passing eval golden cases', () => {
    const failures = TOUR_CUSTOMER_PUBLIC_PROMPTS.filter(
      (row) => !detectTourCustomerPublicAction(row.prompt),
    ).map((row) => row.id);
    expect(failures).toEqual([]);

    expect(
      TOUR_CUSTOMER_PUBLIC_PROMPTS.filter((row) => row.surface === 'customer')
        .length,
    ).toBeGreaterThanOrEqual(30);
    expect(
      TOUR_CUSTOMER_PUBLIC_PROMPTS.filter((row) => row.surface === 'public')
        .length,
    ).toBeGreaterThanOrEqual(30);

    const evalCases = [
      ...AI_COMMAND_EVAL_EXPLAIN_TOUR_BOOKING_CASES,
      ...AI_COMMAND_EVAL_EXPLAIN_TOUR_DAY_SLOTS_CASES,
      ...AI_COMMAND_EVAL_DIAGNOSE_TOUR_CAPACITY_CASES,
      ...AI_COMMAND_EVAL_EXPLAIN_TOUR_BOOKING_RECORD_CUSTOMER_CASES,
      ...AI_COMMAND_EVAL_EXPLAIN_TOUR_MEETING_POINT_CASES,
    ];
    for (const evalCase of evalCases) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
