import { handleExplainManageBookingPageLogic } from './ai-explain-manage-booking-page.logic.js';
import {
  EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS,
  EXPLAIN_MANAGE_BOOKING_PAGE_RESCUE_SCENARIOS,
} from './ai-explain-manage-booking-page.fixtures.js';
import { EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_SCENARIOS } from './ai-explain-manage-booking-page-multilingual.fixtures.js';

describe('ai-explain-manage-booking-page.logic (ai-cmd-customer-4.20.7)', () => {
  it.each(
    EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )('handles customer prompt $0', async (_id, row) => {
    const result = await handleExplainManageBookingPageLogic(
      'biz-1',
      {},
      row.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_manage_booking_page');
    expect(result.details?.aspect).toBe(row.aspect);
  });

  it('navigates guests with token to manage page', async () => {
    const result = await handleExplainManageBookingPageLogic(
      'biz-1',
      { bookingId: 'b1', token: 'tok' },
      'What can I do on this manage page?',
    );
    expect(result.details?.navigate).toEqual({
      path: 'manage',
      query: { bookingId: 'b1', token: 'tok' },
    });
  });

  it('navigates invalid-link guests to login', async () => {
    const result = await handleExplainManageBookingPageLogic(
      'biz-1',
      {},
      'Invalid manage link',
    );
    expect(result.details?.aspect).toBe('invalid_link');
    expect(result.details?.navigate).toEqual({
      path: 'login',
      query: { reason: 'manage_booking' },
    });
  });

  it.each(
    EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('handles multilingual prompt $0', async (_id, row) => {
    const result = await handleExplainManageBookingPageLogic(
      'biz-1',
      {},
      row.prompt,
    );
    expect(result.success).toBe(true);
  });

  it.each(EXPLAIN_MANAGE_BOOKING_PAGE_RESCUE_SCENARIOS)(
    'handles rescued prompt $id',
    async ({ prompt }) => {
      const result = await handleExplainManageBookingPageLogic(
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_manage_booking_page');
    },
  );

  it('fails clarify when prompt does not match', async () => {
    const result = await handleExplainManageBookingPageLogic(
      'biz-1',
      {},
      'What is the weather today?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
