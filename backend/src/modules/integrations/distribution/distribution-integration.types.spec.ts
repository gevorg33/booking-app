import {
  buildMessagingLinksForBusiness,
  getDistributionIntegrations,
} from './distribution-integration.types.js';

describe('distribution-integration.types', () => {
  const business = {
    slug: 'salon-one',
    name: 'Salon One',
    settings: {},
  };

  it('returns empty distribution when settings missing', () => {
    expect(getDistributionIntegrations()).toEqual({});
    expect(getDistributionIntegrations({})).toEqual({});
  });

  it('reads nested distribution settings', () => {
    const settings = {
      integrations: {
        distribution: {
          metaBooking: { enabled: true },
          messaging: { telegramEnabled: true },
        },
      },
    };
    expect(getDistributionIntegrations(settings).metaBooking?.enabled).toBe(
      true,
    );
  });

  it('builds public booking url without trailing slash on frontend', () => {
    const links = buildMessagingLinksForBusiness(
      business,
      'https://app.example.com/',
    );
    expect(links.publicBookingUrl).toBe(
      'https://app.example.com/book/salon-one',
    );
  });

  it('builds telegram deep link when enabled', () => {
    const links = buildMessagingLinksForBusiness(
      {
        ...business,
        settings: {
          integrations: {
            distribution: {
              messaging: {
                telegramEnabled: true,
                telegramBotUsername: '@MyBot',
              },
            },
          },
        },
      },
      'https://app.example.com',
    );
    expect(links.telegramUrl).toBe('https://t.me/MyBot?start=book_salon-one');
  });

  it('builds whatsapp link with custom message', () => {
    const links = buildMessagingLinksForBusiness(
      {
        ...business,
        settings: {
          integrations: {
            distribution: {
              messaging: {
                whatsappBookingEnabled: true,
                whatsappBusinessPhone: '+1 (555) 123-4567',
                whatsappBookingMessage: 'Book me',
              },
            },
          },
        },
      },
      'https://app.example.com',
    );
    expect(links.whatsappUrl).toBe(
      'https://wa.me/15551234567?text=' + encodeURIComponent('Book me'),
    );
  });

  it('uses default whatsapp message when template missing', () => {
    const links = buildMessagingLinksForBusiness(
      {
        ...business,
        settings: {
          integrations: {
            distribution: {
              messaging: {
                whatsappBookingEnabled: true,
                whatsappBusinessPhone: '15551234567',
              },
            },
          },
        },
      },
      'https://app.example.com',
    );
    expect(links.whatsappUrl).toContain('wa.me/15551234567');
    expect(decodeURIComponent(links.whatsappUrl!.split('text=')[1])).toContain(
      'Salon One',
    );
  });

  it('builds meta facebook and instagram links', () => {
    const links = buildMessagingLinksForBusiness(
      {
        ...business,
        settings: {
          integrations: {
            distribution: {
              metaBooking: {
                enabled: true,
                facebookPageUrl: 'https://facebook.com/salon',
                instagramUsername: '@salon',
              },
            },
          },
        },
      },
      'https://app.example.com',
    );
    expect(links.facebookBookingUrl).toBe('https://facebook.com/salon');
    expect(links.instagramBookingUrl).toBe('https://instagram.com/salon');
  });

  it('falls back facebook link to booking url when page url missing', () => {
    const links = buildMessagingLinksForBusiness(
      {
        ...business,
        settings: {
          integrations: {
            distribution: {
              metaBooking: { enabled: true },
            },
          },
        },
      },
      'https://app.example.com',
    );
    expect(links.facebookBookingUrl).toBe(
      'https://app.example.com/book/salon-one',
    );
  });

  it('omits disabled channel links', () => {
    const links = buildMessagingLinksForBusiness(
      business,
      'https://app.example.com',
    );
    expect(links.telegramUrl).toBeNull();
    expect(links.whatsappUrl).toBeNull();
    expect(links.facebookBookingUrl).toBeNull();
    expect(links.instagramBookingUrl).toBeNull();
  });
});
