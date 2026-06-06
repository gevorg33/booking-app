import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { MULTILINGUAL_TOUR_CONSUMER_EVAL_SCENARIOS } from './ai-tour-consumer-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_TOUR_CONSUMER_MULTILINGUAL_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  parseDiagnoseTourCapacityFromPrompt,
  rescueDiagnoseTourCapacityIntent,
} from './ai-tour-capacity.util.js';
import {
  parseExplainTourBookingFromPrompt,
  rescueTourBookingIntent,
} from './ai-tour-booking.util.js';
import {
  parseExplainTourBookingRecordFromPrompt,
  rescueExplainTourBookingRecordIntent,
} from './ai-tour-booking-record.util.js';
import {
  parseExplainTourDaySlotsFromPrompt,
  rescueTourDaySlotsIntent,
} from './ai-tour-day-slots.util.js';

describe('ai-tour-consumer-multilingual.util (ai-cmd-tour-10)', () => {
  const rescueService = new AiIntentRescueService();

  it('rescues consumer tour intents through AiIntentRescueService', () => {
    const rescued = rescueService.rescue({
      prompt:
        'Why does the 3-Day Mountain Trek only show one departure per day?',
      action: 'unknown',
      params: {},
    });
    expect(rescued?.action).toBe('explain_tour_day_slots');
  });

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_TOUR_CONSUMER_MULTILINGUAL_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });

  it.each(MULTILINGUAL_TOUR_CONSUMER_EVAL_SCENARIOS)(
    'rescues multilingual tour consumer scenario $id',
    ({ prompt, expectedAction, paramsPartial }) => {
      if (expectedAction === 'explain_tour_day_slots') {
        expect(rescueTourDaySlotsIntent(prompt, 'unknown')).toEqual({
          action: 'explain_tour_day_slots',
          rescueReason: 'explain_tour_day_slots',
        });
        expect(parseExplainTourDaySlotsFromPrompt(prompt, paramsPartial ?? {})).not.toBeNull();
        return;
      }

      if (expectedAction === 'explain_tour_booking') {
        expect(rescueTourBookingIntent(prompt, 'unknown')).toEqual({
          action: 'explain_tour_booking',
          rescueReason: 'explain_tour_booking',
        });
        expect(parseExplainTourBookingFromPrompt(prompt, paramsPartial ?? {})).not.toBeNull();
        return;
      }

      if (expectedAction === 'diagnose_tour_capacity') {
        expect(rescueDiagnoseTourCapacityIntent(prompt, 'unknown')).toEqual({
          action: 'diagnose_tour_capacity',
          rescueReason: 'diagnose_tour_capacity',
        });
        expect(parseDiagnoseTourCapacityFromPrompt(prompt, paramsPartial ?? {})).not.toBeNull();
        return;
      }

      expect(rescueExplainTourBookingRecordIntent(prompt, 'unknown')).toEqual({
        action: 'explain_tour_booking_record',
        rescueReason: 'explain_tour_booking_record',
      });
      expect(
        parseExplainTourBookingRecordFromPrompt(prompt, paramsPartial ?? {}),
      ).not.toBeNull();
    },
  );
});
