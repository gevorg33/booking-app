import { describe, expect, it } from 'vitest';
import {
  buildGrowthBookingLinks,
  buildSocialLinkEntries,
  hasGrowthBookingLinks,
  socialHref,
} from './consumer-growth-links.util.js';

describe('consumer-growth-links.util', () => {
  it('normalizes social hrefs', () => {
    expect(socialHref('example.com')).toBe('https://example.com');
    expect(socialHref('https://instagram.com/salon')).toBe('https://instagram.com/salon');
  });

  it('builds social link entries in stable order', () => {
    expect(
      buildSocialLinkEntries({
        instagram: 'https://instagram.com/salon',
        website: 'https://salon.example',
      }).map((entry) => entry.id),
    ).toEqual(['website', 'instagram']);
  });

  it('builds growth booking links from meta and messaging', () => {
    const links = buildGrowthBookingLinks({
      metaBooking: { bookingUrl: 'https://fb.me/book', buttonLabel: 'Book on Facebook' },
      messaging: {
        publicBookingUrl: 'https://book.example/salon',
        telegramUrl: 'https://t.me/salon',
        whatsappUrl: null,
      },
    });
    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({ kind: 'meta', customLabel: 'Book on Facebook' });
    expect(links[1]).toMatchObject({ kind: 'telegram' });
  });

  it('detects when growth links exist', () => {
    expect(hasGrowthBookingLinks({})).toBe(false);
    expect(
      hasGrowthBookingLinks({
        messaging: {
          publicBookingUrl: 'https://book.example/salon',
          whatsappUrl: 'https://wa.me/123',
        },
      }),
    ).toBe(true);
  });
});
