import {
  buildPublicBookingLinks,
  buildPurchaserReceiptEmail,
  buildRecipientGiftCardEmail,
  buildWhatsAppGiftCardSummary,
  describeGiftCardValue,
  resolveFrontendBaseUrl,
  resolveGiftCardSenderName,
} from './gift-card-delivery-content.util.js';
import type { GiftCard } from './entities/gift-card.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

function card(
  partial: Partial<GiftCard> & Pick<GiftCard, 'cardType' | 'code'>,
): GiftCard {
  return {
    currency: 'USD',
    balance: 50,
    business: {
      name: 'Glow Salon',
      slug: 'glow-salon',
    } as GiftCard['business'],
    ...partial,
  } as GiftCard;
}

describe('gift-card-delivery-content.util', () => {
  const links = buildPublicBookingLinks(
    'glow-salon',
    'https://app.example.com/',
  )!;

  it('builds tenant-specific public booking URLs', () => {
    expect(resolveFrontendBaseUrl('https://app.example.com/')).toBe(
      'https://app.example.com',
    );
    expect(resolveFrontendBaseUrl(undefined)).toBe('http://localhost:3000');
    expect(links).toEqual({
      bookingUrl: 'https://app.example.com/book/glow-salon',
      accountUrl: 'https://app.example.com/book/glow-salon/account',
      giftCardsUrl: 'https://app.example.com/book/glow-salon/gift-cards',
    });
    expect(buildPublicBookingLinks('', 'https://app.test')).toBeNull();
  });

  it('builds recipient email with sender name and tenant in intro', () => {
    const result = buildRecipientGiftCardEmail(
      card({
        cardType: 'monetary',
        code: 'GCM-ABC123',
        recipientName: 'Alex',
        purchaserEmail: 'jane.doe@test.com',
        personalMessage: 'Enjoy!',
        serviceCredits: [],
      }),
      links,
    );
    expect(result).not.toBeNull();
    const email = result!;

    expect(email.subject).toBe('Your gift card from Jane Doe for Glow Salon');
    expect(email.text).toContain('Hi Alex,');
    expect(email.text).toContain(
      "You've received a gift card from Jane Doe for Glow Salon services!",
    );
    expect(email.text).toContain('GCM-ABC123');
    expect(email.text).toContain('https://app.example.com/book/glow-salon');
    expect(email.html).toContain('Book an appointment</a>');
    expect(email.html).not.toContain('Redeem in your account');
  });

  it('uses purchaser customer name when available', () => {
    const result = buildRecipientGiftCardEmail(
      card({
        cardType: 'monetary',
        code: 'GCM-XYZ',
        recipientName: 'Sam',
        purchaserEmail: 'buyer@test.com',
        purchaser: { name: 'Gevorg Gasparyan' } as GiftCard['purchaser'],
        serviceCredits: [],
      }),
      links,
    );
    expect(result).not.toBeNull();
    const email = result!;

    expect(email.text).toContain(
      "You've received a gift card from Gevorg Gasparyan for Glow Salon services!",
    );
  });

  it('uses stored purchaser name for guest buyers', () => {
    const result = buildRecipientGiftCardEmail(
      card({
        cardType: 'monetary',
        code: 'GCM-GUEST',
        recipientName: 'Alex',
        purchaserEmail: 'guest@test.com',
        purchaserName: 'Maria Guest',
        serviceCredits: [],
      }),
      links,
    );
    expect(result).not.toBeNull();
    const email = result!;

    expect(email.text).toContain(
      "You've received a gift card from Maria Guest for Glow Salon services!",
    );
  });

  it('builds recipient email with account link for package gifts', () => {
    const result = buildRecipientGiftCardEmail(
      card({ cardType: 'package', code: 'GCP-PKG1', serviceCredits: [] }),
      links,
    );
    expect(result).not.toBeNull();
    const email = result!;

    expect(
      describeGiftCardValue(
        card({ cardType: 'package', code: 'X', serviceCredits: [] }),
      ).join(' '),
    ).toContain('Redeem this code in your account');
    expect(email.text).toContain('/book/glow-salon/account');
    expect(email.html).toContain('Redeem in your account</a>');
  });

  it('formats monetary gift card balance with currency symbol', () => {
    const lines = describeGiftCardValue(
      card({
        cardType: 'monetary',
        code: 'GCM-MONEY',
        balance: 50,
        currency: 'USD',
        serviceCredits: [],
      }),
    );
    expect(lines.join('\n')).toMatch(/Balance:.*\$/);
  });

  it('uses business default currency for gift card balance', () => {
    const lines = describeGiftCardValue(
      card({
        cardType: 'monetary',
        code: 'GCM-AMD',
        balance: 15000,
        currency: 'AMD',
        business: makeBusiness({
          name: 'Glow Salon',
          slug: 'glow-salon',
          settings: { currency: 'AMD' },
        }),
        serviceCredits: [],
      }),
    );
    expect(lines.join('\n')).toMatch(/Balance:.*(֏|AMD)/);
  });

  it('builds purchaser receipt with account link and purchase amount', () => {
    const result = buildPurchaserReceiptEmail(
      card({
        cardType: 'service',
        code: 'GCS-1',
        purchaseAmount: 80,
        currency: 'USD',
        serviceCredits: [],
      }),
      'friend@test.com',
      links,
    );
    expect(result).not.toBeNull();
    const receipt = result!;

    expect(receipt.text).toContain('friend@test.com');
    expect(receipt.text).toContain('/book/glow-salon/account');
    expect(receipt.text).toMatch(/Amount paid:.*\$/);
  });

  it('includes booking instructions in WhatsApp summary', () => {
    const summary = buildWhatsAppGiftCardSummary(
      card({
        cardType: 'subscription',
        code: 'GCU-1',
        serviceCredits: [],
      }),
      links,
    );
    expect(summary).toContain(
      'https://app.example.com/book/glow-salon/account',
    );
  });

  it('falls back when business slug is missing', () => {
    const result = buildRecipientGiftCardEmail(
      card({
        cardType: 'monetary',
        code: 'GCM-X',
        business: { name: 'Glow' } as GiftCard['business'],
        serviceCredits: [],
      }),
      null,
    );
    expect(result).not.toBeNull();
    const email = result!;

    expect(email.text).not.toContain('/book/');
    expect(email.text).toContain('booking site');
  });

  it('returns null when tenant disables the recipient template', () => {
    const result = buildRecipientGiftCardEmail(
      card({
        cardType: 'monetary',
        code: 'GCM-OFF',
        business: makeBusiness({
          name: 'Glow',
          slug: 'glow',
          settings: {
            emailTemplates: {
              templates: { gift_card_recipient: { enabled: false } },
            },
          },
        }),
        serviceCredits: [],
      }),
      links,
    );
    expect(result).toBeNull();
  });

  it('returns null when tenant disables the purchaser receipt template', () => {
    const result = buildPurchaserReceiptEmail(
      card({
        cardType: 'service',
        code: 'GCS-OFF',
        business: makeBusiness({
          name: 'Glow',
          slug: 'glow',
          settings: {
            emailTemplates: {
              templates: { gift_card_purchaser_receipt: { enabled: false } },
            },
          },
        }),
        serviceCredits: [],
      }),
      'friend@test.com',
      links,
    );
    expect(result).toBeNull();
  });

  it('describes service and bundle gift values with credits and expiry', () => {
    const lines = describeGiftCardValue(
      card({
        cardType: 'bundle',
        code: 'GCB-1',
        expiresAt: new Date('2027-06-01T00:00:00.000Z'),
        serviceCredits: [{ serviceName: 'Massage', quantityRemaining: 2 }],
      }),
    );
    expect(lines.join('\n')).toContain('Massage × 2');
    expect(lines.join('\n')).toContain('Expires: 01/06/2027');
  });

  it('formats gift card expiry with business dateFormat', () => {
    const lines = describeGiftCardValue(
      card({
        cardType: 'monetary',
        code: 'GCM-EXP',
        business: makeBusiness({
          name: 'Glow Salon',
          slug: 'glow-salon',
          settings: { dateFormat: 'MM/DD/YYYY', timeFormat: '12h' },
        }),
        expiresAt: new Date('2027-06-01T00:00:00.000Z'),
        serviceCredits: [],
      }),
    );
    expect(lines.join('\n')).toContain('Expires: 06/01/2027');
  });

  it('formats gift card expiry as ISO when business uses YYYY-MM-DD', () => {
    const lines = describeGiftCardValue(
      card({
        cardType: 'monetary',
        code: 'GCM-ISO',
        business: makeBusiness({
          name: 'Glow Salon',
          slug: 'glow-salon',
          settings: { dateFormat: 'YYYY-MM-DD', timeFormat: '24h' },
        }),
        expiresAt: new Date('2027-06-01T00:00:00.000Z'),
        serviceCredits: [],
      }),
    );
    expect(lines.join('\n')).toContain('Expires: 2027-06-01');
  });

  it('includes ISO expiry in WhatsApp gift card summary', () => {
    const summary = buildWhatsAppGiftCardSummary(
      card({
        cardType: 'monetary',
        code: 'GCM-WA',
        business: makeBusiness({
          name: 'Glow Salon',
          slug: 'glow-salon',
          settings: { dateFormat: 'YYYY-MM-DD' },
        }),
        expiresAt: new Date('2027-06-01T00:00:00.000Z'),
        serviceCredits: [],
      }),
      null,
    );
    expect(summary).toContain('2027-06-01');
  });

  it('builds package redemption instructions without public links', () => {
    const email = buildRecipientGiftCardEmail(
      card({
        cardType: 'package',
        code: 'GCP-NOLINK',
        business: { name: 'Glow' } as GiftCard['business'],
        serviceCredits: [],
      }),
      null,
    );
    expect(email).not.toBeNull();
    expect(email!.text).toContain(
      'Sign in to your account on the booking site',
    );
  });

  it('resolves sender names from purchaser metadata, stored names, email, or fallback', () => {
    expect(
      resolveGiftCardSenderName(
        card({
          cardType: 'monetary',
          code: 'A',
          purchaserEmail: 'buyer@test.com',
          serviceCredits: [],
        }),
      ),
    ).toBe('Buyer');
    expect(
      resolveGiftCardSenderName(
        card({
          cardType: 'monetary',
          code: 'B',
          purchaserEmail: 'jane.doe@test.com',
          serviceCredits: [],
        }),
      ),
    ).toBe('Jane Doe');
    expect(
      resolveGiftCardSenderName(
        card({
          cardType: 'monetary',
          code: 'C',
          purchaserEmail: '@',
          serviceCredits: [],
        }),
      ),
    ).toBe('Someone');
    expect(
      resolveGiftCardSenderName(
        card({ cardType: 'monetary', code: 'D', serviceCredits: [] }),
      ),
    ).toBe('Someone');
  });

  it('builds purchaser receipt without account links when slug is missing', () => {
    const receipt = buildPurchaserReceiptEmail(
      card({
        cardType: 'monetary',
        code: 'GCM-R',
        business: { name: 'Glow' } as GiftCard['business'],
        serviceCredits: [],
      }),
      'friend@test.com',
      null,
    );
    expect(receipt).not.toBeNull();
    expect(receipt!.text).not.toContain('View your gift card orders');
    expect(receipt!.html).not.toContain('<a href=');
  });

  it('escapes personal message HTML and includes subscription redemption buttons', () => {
    const email = buildRecipientGiftCardEmail(
      card({
        cardType: 'subscription',
        code: 'GCU-HTML',
        recipientName: 'Sam',
        personalMessage: '<script>alert(1)</script>',
        business: { name: 'Glow', slug: 'glow' } as GiftCard['business'],
        serviceCredits: [],
      }),
      links,
    );
    expect(email).not.toBeNull();
    expect(email!.html).toContain('&lt;script&gt;');
    expect(email!.html).toContain('Redeem in your account');
  });

  it('uses generic gift card label for unknown card types', () => {
    expect(
      describeGiftCardValue(
        card({
          cardType: 'unknown' as GiftCard['cardType'],
          code: 'X',
          serviceCredits: [],
        }),
      )[0],
    ).toBe('Gift card');
  });

  it('includes personal message in WhatsApp summary', () => {
    const summary = buildWhatsAppGiftCardSummary(
      card({
        cardType: 'monetary',
        code: 'GCM-MSG',
        personalMessage: 'Enjoy your gift',
        serviceCredits: [],
      }),
      null,
    );
    expect(summary).toContain('Enjoy your gift');
  });

  it('uses fallback business names when tenant metadata is missing', () => {
    const email = buildRecipientGiftCardEmail(
      {
        ...card({
          cardType: 'monetary',
          code: 'GCM-NOBIZ',
          serviceCredits: [],
        }),
        business: undefined,
      } as GiftCard,
      links,
    );
    expect(email).not.toBeNull();
    expect(email!.text).toContain('your business');

    const receipt = buildPurchaserReceiptEmail(
      {
        ...card({
          cardType: 'monetary',
          code: 'GCM-NOBIZ',
          serviceCredits: [],
        }),
        business: undefined,
      } as GiftCard,
      'friend@test.com',
      links,
    );
    expect(receipt).not.toBeNull();
    expect(receipt!.text).toContain('the business');
  });
});
