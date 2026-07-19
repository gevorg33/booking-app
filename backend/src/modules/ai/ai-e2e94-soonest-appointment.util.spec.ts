import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  E2E94_BOOK_NEAREST_MUTATE_SCENARIOS,
  E2E94_SOONEST_APPOINTMENT_SCENARIOS,
} from './ai-e2e94-soonest-appointment.fixtures.js';
import {
  enrichFindSoonestParamsFromPrompt,
  isFindSoonestAppointmentPrompt,
} from './ai-find-soonest-appointment.util.js';
import { isHowToDownloadAppPrompt } from './ai-how-to-download-app.util.js';
import { isExplainResultStatusPrompt } from './ai-consumer-clinic-test-results.util.js';
import { isBookNearestSlotPrompt } from './ai-payments.util.js';

describe('e2e-bug.94 soonest appointment routing', () => {
  const rescue = new AiIntentRescueService();

  it.each(
    E2E94_SOONEST_APPOINTMENT_SCENARIOS.map((row) => [row.id, row] as const),
  )('detects + rescues %s', (_id, row) => {
    expect(isFindSoonestAppointmentPrompt(row.prompt)).toBe(true);
    expect(isHowToDownloadAppPrompt(row.prompt)).toBe(false);
    expect(isExplainResultStatusPrompt(row.prompt)).toBe(false);

    const result = rescue.rescue({
      prompt: row.prompt,
      action: row.misclassifiedAction,
      params: {},
      surface: row.surface,
    });
    expect(result?.action).toBe(row.expectedAction);
    expect(result?.rescueReason).toBe('soonest_appointment');
    expect(result?.params?.bookingFirstAvailable).toBe(true);
    if (!row.expectServiceName) {
      expect(result?.params?.serviceName).toBeUndefined();
    }
  });

  it.each(
    E2E94_BOOK_NEAREST_MUTATE_SCENARIOS.map((row) => [row.id, row] as const),
  )('keeps mutate book phrasing on %s', (_id, row) => {
    expect(isFindSoonestAppointmentPrompt(row.prompt)).toBe(false);
    expect(isBookNearestSlotPrompt(row.prompt)).toBe(true);

    const result = rescue.rescue({
      prompt: row.prompt,
      action: 'unknown',
      params: {},
      surface: row.surface,
    });
    expect(result?.action).toBe(row.expectedAction);
  });

  it('does not invent a service name from "soonest I can get an appointment"', () => {
    const enriched = enrichFindSoonestParamsFromPrompt(
      {},
      "what's the soonest I can get an appointment?",
    );
    expect(enriched.bookingFirstAvailable).toBe(true);
    expect(enriched.serviceName).toBeUndefined();
  });
});
