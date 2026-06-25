import {
  buildBookingManageUrl,
  ensureBookingManageToken,
  formatBookingManageLinkHtml,
  formatBookingManageLinkText,
  validateBookingManageToken,
} from './booking-manage-token.util.js';

describe('booking-manage-token.util', () => {
  it('buildBookingManageUrl encodes params on tenant subdomain', () => {
    const url = buildBookingManageUrl(
      'https://app.test/',
      'salon',
      'book-1',
      'tok-abc',
      'test',
    );
    expect(url).toBe(
      'https://salon.test/manage?bookingId=book-1&token=tok-abc',
    );
  });

  it('formatBookingManageLinkHtml uses underlined here anchor', () => {
    const html = formatBookingManageLinkHtml(
      'Manage your booking (reschedule or cancel)',
      'https://app.test/book/salon/manage?bookingId=b1&token=tok',
    );
    expect(html).toBe(
      'Manage your booking (reschedule or cancel): <a href="https://app.test/book/salon/manage?bookingId=b1&amp;token=tok" style="text-decoration:underline">here</a>',
    );
  });

  it('formatBookingManageLinkText keeps URL for plain-text clients', () => {
    expect(
      formatBookingManageLinkText(
        'Manage your booking (cancel)',
        'https://app.test/manage',
      ),
    ).toBe('Manage your booking (cancel): https://app.test/manage');
  });

  it('validateBookingManageToken accepts matching token', () => {
    expect(
      validateBookingManageToken(
        { metadata: { manageToken: 'secret' } } as any,
        'secret',
      ),
    ).toBe(true);
  });

  it('validateBookingManageToken rejects missing or wrong token', () => {
    expect(validateBookingManageToken({ metadata: {} } as any, 'secret')).toBe(
      false,
    );
    expect(
      validateBookingManageToken(
        { metadata: { manageToken: 'a' } } as any,
        'b',
      ),
    ).toBe(false);
    expect(
      validateBookingManageToken(
        { metadata: { manageToken: 123 } } as any,
        '123',
      ),
    ).toBe(false);
  });

  it('ensureBookingManageToken returns existing token without saving', async () => {
    const booking = {
      id: 'book-1',
      metadata: { manageToken: 'existing-token' },
    };
    const bookingRepo = {
      findOne: jest.fn().mockResolvedValue(booking),
      save: jest.fn(),
    };

    const token = await ensureBookingManageToken(bookingRepo as any, 'book-1');
    expect(token).toBe('existing-token');
    expect(bookingRepo.save).not.toHaveBeenCalled();
  });

  it('ensureBookingManageToken creates and persists new token', async () => {
    const booking = {
      id: 'book-2',
      metadata: {},
    };
    const bookingRepo = {
      findOne: jest.fn().mockResolvedValue(booking),
      save: jest.fn().mockImplementation(async (b) => b),
    };

    const token = await ensureBookingManageToken(bookingRepo as any, 'book-2');
    expect(token).toMatch(/^[a-f0-9]{48}$/);
    expect(booking.metadata?.manageToken).toBe(token);
    expect(bookingRepo.save).toHaveBeenCalledWith(booking);
  });

  it('ensureBookingManageToken treats missing metadata as empty object', async () => {
    const booking = {
      id: 'book-3',
      metadata: null as unknown as Record<string, unknown>,
    };
    const bookingRepo = {
      findOne: jest.fn().mockResolvedValue(booking),
      save: jest.fn().mockImplementation(async (b) => b),
    };

    const token = await ensureBookingManageToken(bookingRepo as any, 'book-3');
    expect(token).toMatch(/^[a-f0-9]{48}$/);
    expect(booking.metadata?.manageToken).toBe(token);
  });

  it('ensureBookingManageToken throws when booking missing', async () => {
    const bookingRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    await expect(
      ensureBookingManageToken(bookingRepo as any, 'missing'),
    ).rejects.toThrow('Booking not found');
  });
});
