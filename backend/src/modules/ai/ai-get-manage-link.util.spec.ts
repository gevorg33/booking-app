import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  GET_MANAGE_LINK_PROMPTS,
  GET_MANAGE_LINK_RESCUE_SCENARIOS,
} from './ai-get-manage-link.fixtures.js';
import { GET_MANAGE_LINK_MULTILINGUAL_SCENARIOS } from './ai-get-manage-link-multilingual.fixtures.js';
import {
  extractGuestContactFromPrompt,
  isGetManageLinkPrompt,
  isGetManageLinkIntent,
  isGuestManageLinkLookupPrompt,
  buildGuestManageLinkAmbiguousSummary,
  buildManageLinkResendSummary,
  contactMatchesBookingCustomer,
  lookupUpcomingBookingsByGuestContact,
  parseGetManageLinkFromPrompt,
  rescueGetManageLinkIntent,
  shouldResendManageLinkNotification,
} from './ai-get-manage-link.util.js';

describe('ai-get-manage-link.util (ai-cmd-customer-4.4.5)', () => {
  it.each(GET_MANAGE_LINK_PROMPTS)('detects prompt $id', ({ prompt }) => {
    expect(isGetManageLinkPrompt(prompt)).toBe(true);
    expect(parseGetManageLinkFromPrompt(prompt)).not.toBeNull();
  });

  it.each(GET_MANAGE_LINK_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isGetManageLinkPrompt(prompt)).toBe(true);
      expect(parseGetManageLinkFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(GET_MANAGE_LINK_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(rescueGetManageLinkIntent(prompt, misclassifiedAction)).toEqual({
        action: expectedAction,
        rescueReason: 'manage_link',
      });
    },
  );

  it('extracts guest email and phone from prompt', () => {
    expect(
      extractGuestContactFromPrompt('Resend manage link to john@example.com'),
    ).toEqual({ email: 'john@example.com' });
    expect(
      extractGuestContactFromPrompt(
        'Text me the booking manage link at 5551234567',
      ),
    ).toEqual({ phone: '5551234567' });
  });

  it('flags guest lookup only from fixtures when present', () => {
    expect(
      isGuestManageLinkLookupPrompt('Get manage link for my booking'),
    ).toBe(false);
  });

  it('does not steal share_my_booking prompts', () => {
    expect(isGetManageLinkPrompt('Share my appointment with my partner')).toBe(
      false,
    );
  });

  it('does not steal recover_lost_manage_link guest prompts', () => {
    expect(isGetManageLinkPrompt('I lost my booking confirmation email')).toBe(
      false,
    );
    expect(
      isGetManageLinkPrompt('Resend manage link to john@example.com'),
    ).toBe(false);
  });

  it('steals guest recovery prompts from generic manage-link heuristics', () => {
    expect(
      isGuestManageLinkLookupPrompt('Resend manage link to john@example.com'),
    ).toBe(false);
    expect(
      isGetManageLinkPrompt(
        'I booked as a guest — email me the manage link at mia@salon.com',
      ),
    ).toBe(false);
  });

  it('matches guest contact to booking customer', () => {
    expect(
      contactMatchesBookingCustomer(
        { customer: { email: 'john@example.com', phone: '5551234567' } } as any,
        { email: 'john@example.com' },
      ),
    ).toBe(true);
    expect(
      contactMatchesBookingCustomer(
        { customer: { email: 'john@example.com', phone: '5551234567' } } as any,
        { phone: '5551234567' },
      ),
    ).toBe(true);
  });

  it('looks up bookings by guest contact', async () => {
    const bookingRepo = {
      find: jest.fn(async () => [
        {
          id: 'book-1',
          status: BookingStatus.CONFIRMED,
          startTime: new Date('2030-01-15T14:00:00.000Z'),
          customer: { email: 'john@example.com', phone: '5551234567' },
          service: { name: 'Massage' },
        },
      ]),
    };
    const matches = await lookupUpcomingBookingsByGuestContact(
      bookingRepo as any,
      'biz-1',
      { email: 'john@example.com' },
      new Date('2030-01-01T00:00:00.000Z'),
    );
    expect(matches).toHaveLength(1);
  });

  it('requires resend for auto delivery', () => {
    expect(shouldResendManageLinkNotification('auto')).toBe(true);
    expect(shouldResendManageLinkNotification('link_only')).toBe(false);
  });

  it('builds ambiguous and resend summaries', () => {
    expect(
      buildGuestManageLinkAmbiguousSummary([
        {
          id: 'b1',
          startTime: new Date('2030-01-01T10:00:00.000Z'),
          service: { name: 'Facial' },
        } as any,
      ]),
    ).toMatch(/Multiple upcoming bookings/);
    expect(
      buildManageLinkResendSummary({
        delivery: 'sms',
        phone: '5551234567',
        resent: true,
      }),
    ).toMatch(/text to 5551234567/);
  });

  it('recognizes get_manage_link intent', () => {
    expect(isGetManageLinkIntent('get_manage_link')).toBe(true);
  });
});
