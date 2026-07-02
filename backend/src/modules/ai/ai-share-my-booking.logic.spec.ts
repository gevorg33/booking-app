import { handleShareMyBookingLogic } from './ai-share-my-booking.logic.js';
import type { ShareMyBookingLogicDeps } from './ai-share-my-booking.logic.js';

function makeDeps(
  overrides: Partial<ShareMyBookingLogicDeps> = {},
): ShareMyBookingLogicDeps {
  return {
    publicBookingService: {
      getCustomerShareRewards: jest.fn(async () => ({
        bookingShareEnabled: true,
        bookingRewardSummary: '50 points',
        salonShareEnabled: false,
        salonRewardSummary: '',
      })),
    } as unknown as ShareMyBookingLogicDeps['publicBookingService'],
    ...overrides,
  };
}

describe('ai-share-my-booking.logic (ai-cmd-customer-4.3.7)', () => {
  it('returns share guidance with reward hint and bookings navigate', async () => {
    const result = await handleShareMyBookingLogic(
      makeDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'glow-salon' },
      'Share my booking',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('share_my_booking');
    expect(result.summary).toContain('share sheet');
    expect(result.summary).toContain('50 points');
    expect(result.details.navigate).toEqual({
      path: 'account',
      query: { section: 'bookings' },
    });
    expect(result.details.bookingShareEnabled).toBe(true);
  });

  it('includes booking-specific hint when session bookingId is present', async () => {
    const result = await handleShareMyBookingLogic(
      makeDeps(),
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        slug: 'glow-salon',
        bookingId: 'book-1',
      },
      'Share my massage appointment',
    );

    expect(result.success).toBe(true);
    expect(result.details.bookingId).toBe('book-1');
    expect(result.summary).toContain('that visit');
  });

  it('requires sign-in', async () => {
    const result = await handleShareMyBookingLogic(
      makeDeps(),
      'biz-1',
      { slug: 'glow-salon' },
      'Share my booking',
    );

    expect(result.success).toBe(false);
    expect(result.details.clarify).toBe(true);
  });

  it('returns failure when business slug is missing', async () => {
    const result = await handleShareMyBookingLogic(
      makeDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Share my booking',
    );

    expect(result.success).toBe(false);
  });

  it('returns clarify for non-share prompts', async () => {
    const result = await handleShareMyBookingLogic(
      makeDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'glow-salon' },
      'What time is my appointment?',
    );

    expect(result.success).toBe(false);
    expect(result.details.clarify).toBe(true);
  });
});
