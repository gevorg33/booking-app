import { DEFAULT_GIFT_CARD_SETTINGS } from './gift-card.types.js';
import {
  evaluateGiftCardOrderPolicy,
  isGiftCardFullyRedeemed,
} from './gift-card-order-policy.util.js';

describe('gift-card-order-policy.util', () => {
  const settings = { ...DEFAULT_GIFT_CARD_SETTINGS, cancelModifyEnabled: true, cancelModifyWindowHours: 24 };
  const now = new Date('2026-06-02T12:00:00.000Z');
  const createdAt = new Date('2026-06-02T10:00:00.000Z');

  it('detects fully redeemed monetary and service cards', () => {
    expect(isGiftCardFullyRedeemed({ cardType: 'monetary', balance: 0, isActive: true })).toBe(true);
    expect(
      isGiftCardFullyRedeemed({
        cardType: 'service',
        isActive: true,
        serviceCredits: [{ quantityRemaining: 0 }],
      }),
    ).toBe(true);
    expect(isGiftCardFullyRedeemed({ cardType: 'monetary', balance: 10, isActive: true })).toBe(
      false,
    );
  });

  it('allows cancel/modify inside policy window', () => {
    const result = evaluateGiftCardOrderPolicy(
      { createdAt, deliveryMethod: 'digital', fulfillmentStatus: 'delivered', balance: 50, cardType: 'monetary', isActive: true },
      settings,
      null,
      now,
    );
    expect(result.canCancel).toBe(true);
    expect(result.canModify).toBe(true);
    expect(result.windowRemainingMs).toBeGreaterThan(0);
  });

  it('blocks when policy disabled or window expired', () => {
    expect(
      evaluateGiftCardOrderPolicy({ createdAt, balance: 50, cardType: 'monetary', isActive: true }, {
        ...settings,
        cancelModifyEnabled: false,
      }, null, now).canCancel,
    ).toBe(false);

    expect(
      evaluateGiftCardOrderPolicy(
        { createdAt: new Date('2026-05-01T12:00:00.000Z'), balance: 50, cardType: 'monetary', isActive: true },
        settings,
        null,
        now,
      ).blockReason,
    ).toMatch(/window has expired/);
  });

  it('blocks physical orders after card creation when configured', () => {
    const result = evaluateGiftCardOrderPolicy(
      {
        createdAt,
        deliveryMethod: 'physical',
        fulfillmentStatus: 'ready_for_delivery',
        balance: 50,
        cardType: 'monetary',
        isActive: true,
      },
      settings,
      null,
      now,
    );
    expect(result.canCancel).toBe(false);
    expect(result.blockReason).toMatch(/card creation/);
  });

  it('blocks when order is cancelled or inactive', () => {
    expect(
      evaluateGiftCardOrderPolicy(
        { createdAt, fulfillmentStatus: 'cancelled', balance: 50, cardType: 'monetary', isActive: true },
        settings,
        null,
        now,
      ).blockReason,
    ).toMatch(/cancelled/);
  });

  it('blocks when open request exists', () => {
    const result = evaluateGiftCardOrderPolicy(
      { createdAt, balance: 50, cardType: 'monetary', isActive: true },
      settings,
      { status: 'in_review' },
      now,
    );
    expect(result.canCancel).toBe(false);
    expect(result.blockReason).toMatch(/already in progress/);
  });

  it('detects partially redeemed bundle cards', () => {
    expect(
      isGiftCardFullyRedeemed({
        cardType: 'bundle',
        isActive: true,
        serviceCredits: [{ quantityRemaining: 1 }, { quantityRemaining: 0 }],
      }),
    ).toBe(false);
  });

  it('treats service cards without credits as not fully redeemed', () => {
    expect(
      isGiftCardFullyRedeemed({ cardType: 'service', isActive: true, serviceCredits: [] }),
    ).toBe(false);
  });

  it('accepts ISO createdAt strings', () => {
    const result = evaluateGiftCardOrderPolicy(
      {
        createdAt: createdAt.toISOString(),
        balance: 50,
        cardType: 'monetary',
        isActive: true,
      },
      settings,
      null,
      now,
    );
    expect(result.canCancel).toBe(true);
  });

  it('treats inactive cards as fully redeemed', () => {
    expect(isGiftCardFullyRedeemed({ isActive: false, cardType: 'monetary', balance: 50 })).toBe(
      true,
    );
  });

  it('allows requests when cancel window hours is zero', () => {
    const result = evaluateGiftCardOrderPolicy(
      { createdAt: new Date('2020-01-01'), balance: 50, cardType: 'monetary', isActive: true },
      { ...settings, cancelModifyWindowHours: 0 },
      null,
      now,
    );
    expect(result.canCancel).toBe(true);
  });

  it('uses createdAt fallback for policy evaluation', () => {
    const result = evaluateGiftCardOrderPolicy(
      { balance: 50, cardType: 'monetary', isActive: true },
      settings,
      null,
      now,
    );
    expect(result.canCancel).toBe(true);
  });
});
