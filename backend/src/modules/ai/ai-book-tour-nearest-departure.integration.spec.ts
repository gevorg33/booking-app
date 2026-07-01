import { BOOK_TOUR_NEAREST_DEPARTURE_PROMPTS } from './ai-book-tour-nearest-departure.fixtures.js';
import {
  decomposeDeterministicForSurface,
  matchGoldenCompoundPattern,
} from './intent-decomposition.util.js';
import { executePublicAssistantCompoundFromSteps } from '../public-booking/public-booking-assistant-compound.logic.js';
import { rescueBookTourNearestDepartureCompoundIntent } from './ai-book-tour-nearest-departure.util.js';

describe('book_tour_nearest_departure integration (ai-cmd-customer-4.10.5)', () => {
  it.each(
    BOOK_TOUR_NEAREST_DEPARTURE_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )('golden-decomposes customer compound for $id', (_id, row) => {
    const golden = matchGoldenCompoundPattern('customer', row.prompt);
    expect(golden?.steps.map((step) => step.action)).toEqual([
      ...row.orderedActions,
    ]);
    expect(golden?.steps[2]?.params.bookingFirstAvailable).toBe(true);
  });

  it.each(
    BOOK_TOUR_NEAREST_DEPARTURE_PROMPTS.filter(
      (row) => row.surface === 'public',
    ).map((row) => [row.id, row] as const),
  )('golden-decomposes public compound for $id', (_id, row) => {
    const golden = matchGoldenCompoundPattern('public', row.prompt);
    expect(golden?.recipeId).toBe('public_book_tour_nearest_departure');
    expect(golden?.steps.map((step) => step.action)).toEqual([
      ...row.orderedActions,
    ]);
  });

  it('executes public compound steps with tour context propagation', async () => {
    const prompt = 'Book the wine tour earliest date for 2 people';
    const decomposition = decomposeDeterministicForSurface('public', prompt);
    expect(decomposition?.steps.length).toBe(3);

    const result = await executePublicAssistantCompoundFromSteps(
      prompt,
      decomposition!.steps,
      {},
      {
        runStep: async (action, params) => {
          if (action === 'explain_tour_booking') {
            return {
              success: true,
              action,
              summary: 'Tour catalog resolved.',
              sessionContext: {
                serviceId: 'svc-wine',
                serviceName: 'Wine Country',
              },
            };
          }
          if (action === 'explain_tour_day_slots') {
            expect(params.paxCount).toBe(2);
            return {
              success: true,
              action,
              summary: 'Nearest departure has remaining spots.',
              sessionContext: { date: '2026-08-15' },
            };
          }
          expect(params.paxCount).toBe(2);
          expect(params.bookingFirstAvailable).toBe(true);
          expect(params.serviceName).toBeTruthy();
          return {
            success: true,
            action,
            summary: 'Tour booked.',
            details: { serviceId: 'svc-wine' },
          };
        },
      },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('compound_intent');
  });

  it('rescues misclassified book_appointment to compound', () => {
    const rescued = rescueBookTourNearestDepartureCompoundIntent(
      'Book the wine tour earliest date for 2 people',
      'book_appointment',
    );
    expect(rescued?.action).toBe('compound_intent');
    expect(rescued?.rescueReason).toBe('book_tour_nearest_departure_compound');
  });
});
