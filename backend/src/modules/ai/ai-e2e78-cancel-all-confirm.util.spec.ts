import {
  E2E78_AFFIRMATIONS,
  E2E78_FIRST_TURN_PROMPTS,
  E2E78_NON_CONFIRM,
  E2E78_PREVIEW_SUMMARY,
} from './ai-e2e78-cancel-all-confirm.fixtures.js';
import {
  enrichCancelAllUpcomingConfirmFromPrompt,
  isCancelAllUpcomingAffirmativePrompt,
  isCancelAllUpcomingPreviewAssistantMessage,
  rescueCancelAllUpcomingConfirmIntent,
} from './ai-cancel-all-upcoming-bookings.util.js';
import { handleCancelAllUpcomingBookingsLogic } from './ai-self-service-booking.logic.js';
import { CUSTOMER_CANCEL_ALL_UPCOMING_BOOKINGS_CLASSIFIER_RULES } from './ai-cancel-all-upcoming-bookings.fixtures.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';

describe('e2e-bug.78 cancel_all_upcoming_bookings confirm turn', () => {
  const rescue = new AiIntentRescueService();
  const previewHistory = [
    { role: 'user' as const, content: 'cancel every appointment I have' },
    { role: 'assistant' as const, content: E2E78_PREVIEW_SUMMARY },
  ];

  const bulkDeps = () => ({
    publicCustomerBookingService: {
      bulkCancelUpcomingBookings: jest.fn(
        async (
          _slug: string,
          _customerId: string,
          body: { confirm?: boolean },
        ) => {
          if (!body.confirm) {
            return {
              requiresConfirmation: true,
              count: 2,
              bookings: [
                {
                  id: 'b1',
                  serviceName: 'facemassage',
                  startTime: new Date('2026-07-18T15:59:00Z'),
                },
                {
                  id: 'b2',
                  serviceName: 'facemassage',
                  startTime: new Date('2026-07-19T18:35:00Z'),
                },
              ],
            };
          }
          return {
            requiresConfirmation: false,
            cancelled: 2,
            failed: 0,
            results: [],
          };
        },
      ),
    },
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'salon' })),
    },
  });

  it('classifier schema documents confirm follow-up phrases', () => {
    const schema = buildCustomerClassifierSchema();
    expect(CUSTOMER_CANCEL_ALL_UPCOMING_BOOKINGS_CLASSIFIER_RULES).toContain(
      'yes, cancel them all',
    );
    expect(CUSTOMER_CANCEL_ALL_UPCOMING_BOOKINGS_CLASSIFIER_RULES).toContain(
      'params.confirm=true',
    );
    expect(schema).toContain('yes, cancel them all');
  });

  it('detects the live preview assistant message', () => {
    expect(
      isCancelAllUpcomingPreviewAssistantMessage(E2E78_PREVIEW_SUMMARY),
    ).toBe(true);
  });

  it.each(E2E78_AFFIRMATIONS)(
    '$id: affirmative detectors match',
    ({ prompt }) => {
      expect(isCancelAllUpcomingAffirmativePrompt(prompt)).toBe(true);
    },
  );

  it.each(E2E78_AFFIRMATIONS)(
    '$id: enrich sets confirm from history preview',
    ({ prompt }) => {
      expect(
        enrichCancelAllUpcomingConfirmFromPrompt(prompt, {}, previewHistory)
          .confirm,
      ).toBe(true);
    },
  );

  it.each(E2E78_AFFIRMATIONS)(
    '$id: enrich sets confirm from session pending',
    ({ prompt }) => {
      expect(
        enrichCancelAllUpcomingConfirmFromPrompt(prompt, {
          cancelAllUpcomingPending: true,
        }).confirm,
      ).toBe(true);
    },
  );

  it.each(E2E78_AFFIRMATIONS)(
    '$id: rescue remaps unknown/cancel_all with confirm',
    ({ prompt }) => {
      for (const fromAction of [
        'unknown',
        'cancel_all_upcoming_bookings',
        'my_appointments',
      ] as const) {
        const rescued = rescueCancelAllUpcomingConfirmIntent(
          prompt,
          fromAction,
          { cancelAllUpcomingPending: true },
        );
        expect(rescued?.action).toBe('cancel_all_upcoming_bookings');
        expect(rescued?.params.confirm).toBe(true);

        const historyRescued = rescue.rescue({
          prompt,
          action: fromAction,
          params: { conversationHistory: previewHistory },
          surface: 'customer',
        });
        expect(historyRescued?.action).toBe('cancel_all_upcoming_bookings');
        expect(historyRescued?.params?.confirm).toBe(true);
      }
    },
  );

  it.each(E2E78_NON_CONFIRM)(
    '$id: does not confirm without pending/preview',
    ({ prompt }) => {
      expect(
        enrichCancelAllUpcomingConfirmFromPrompt(prompt, {}).confirm,
      ).toBeUndefined();
      expect(
        rescueCancelAllUpcomingConfirmIntent(prompt, 'unknown', {}),
      ).toBeNull();
    },
  );

  it.each(E2E78_FIRST_TURN_PROMPTS)(
    '$id: first turn previews and does not cancel',
    async ({ prompt }) => {
      const d = bulkDeps();
      const result = await handleCancelAllUpcomingBookingsLogic(
        d as never,
        'biz-1',
        { sessionCustomerId: 'c1' },
        prompt,
      );
      expect(result.success).toBe(false);
      expect(result.details?.requiresConfirmation).toBe(true);
      expect(result.details?.cancelAllUpcomingPending).toBe(true);
      expect(result.summary).toMatch(/Reply yes to confirm/i);
      expect(
        d.publicCustomerBookingService.bulkCancelUpcomingBookings,
      ).toHaveBeenCalledWith('salon', 'c1', {
        confirm: false,
        bookingIds: undefined,
      });
    },
  );

  it.each(E2E78_AFFIRMATIONS)(
    '$id: second turn with history executes cancel',
    async ({ prompt }) => {
      const d = bulkDeps();
      const result = await handleCancelAllUpcomingBookingsLogic(
        d as never,
        'biz-1',
        {
          sessionCustomerId: 'c1',
          conversationHistory: previewHistory,
        },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.summary).toMatch(/Cancelled 2/i);
      expect(
        d.publicCustomerBookingService.bulkCancelUpcomingBookings,
      ).toHaveBeenCalledWith('salon', 'c1', {
        confirm: true,
        bookingIds: undefined,
      });
    },
  );

  it('second turn with session pending executes cancel', async () => {
    const d = bulkDeps();
    const result = await handleCancelAllUpcomingBookingsLogic(
      d as never,
      'biz-1',
      {
        sessionCustomerId: 'c1',
        cancelAllUpcomingPending: true,
        requiresConfirmation: true,
        pendingAction: 'cancel_all_upcoming_bookings',
        bookingIds: ['b1', 'b2'],
      },
      'yes, cancel them all',
    );
    expect(result.success).toBe(true);
    expect(
      d.publicCustomerBookingService.bulkCancelUpcomingBookings,
    ).toHaveBeenCalledWith('salon', 'c1', {
      confirm: true,
      bookingIds: ['b1', 'b2'],
    });
  });
});
