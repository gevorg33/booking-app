import {
  buildPublicBookingLinks,
  buildPurchaserReceiptEmail,
  buildRecipientGiftCardEmail,
  buildWhatsAppGiftCardSummary,
  describeGiftCardValue,
} from './gift-card-delivery-content.util.js';
import type { GiftCard } from './entities/gift-card.entity.js';

function card(partial: Partial<GiftCard> & Pick<GiftCard, 'cardType' | 'code'>): GiftCard {
  return {
    currency: 'USD',
    balance: 50,
    business: { name: 'Glow Salon', slug: 'glow-salon' } as GiftCard['business'],
    ...partial,
  } as GiftCard;
}

describe('gift-card-delivery-content.util', () => {
  const links = buildPublicBookingLinks('glow-salon', 'https://app.example.com/')!;

  it('builds tenant-specific public booking URLs', () => {
    expect(links).toEqual({
      bookingUrl: 'https://app.example.com/book/glow-salon',
      accountUrl: 'https://app.example.com/book/glow-salon/account',
      giftCardsUrl: 'https://app.example.com/book/glow-salon/gift-cards',
    });
    expect(buildPublicBookingLinks('', 'https://app.test')).toBeNull();
  });

  it('builds recipient email with sender name and tenant in intro', () => {
    const email = buildRecipientGiftCardEmail(
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
    const email = buildRecipientGiftCardEmail(
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

    expect(email.text).toContain(
      "You've received a gift card from Gevorg Gasparyan for Glow Salon services!",
    );
  });

  it('uses stored purchaser name for guest buyers', () => {
    const email = buildRecipientGiftCardEmail(
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

    expect(email.text).toContain(
      "You've received a gift card from Maria Guest for Glow Salon services!",
    );
  });

  it('builds recipient email with account link for package gifts', () => {
    const email = buildRecipientGiftCardEmail(
      card({ cardType: 'package', code: 'GCP-PKG1', serviceCredits: [] }),
      links,
    );

    expect(
      describeGiftCardValue(card({ cardType: 'package', code: 'X', serviceCredits: [] })).join(' '),
    ).toContain('Redeem this code in your account');
    expect(email.text).toContain('/book/glow-salon/account');
    expect(email.html).toContain('Redeem in your account</a>');
  });

  it('builds purchaser receipt with account link', () => {
    const receipt = buildPurchaserReceiptEmail(
      card({ cardType: 'service', code: 'GCS-1', serviceCredits: [] }),
      'friend@test.com',
      links,
    );
    expect(receipt.text).toContain('friend@test.com');
    expect(receipt.text).toContain('/book/glow-salon/account');
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
    expect(summary).toContain('https://app.example.com/book/glow-salon/account');
  });

  it('falls back when business slug is missing', () => {
    const email = buildRecipientGiftCardEmail(
      card({
        cardType: 'monetary',
        code: 'GCM-X',
        business: { name: 'Glow' } as GiftCard['business'],
        serviceCredits: [],
      }),
      null,
    );
    expect(email.text).not.toContain('/book/');
    expect(email.text).toContain('booking site');
  });
});
