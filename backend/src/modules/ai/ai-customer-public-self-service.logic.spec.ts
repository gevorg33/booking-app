import { dispatchPublicSelfServiceIntent } from './ai-customer-public-self-service.logic.js';

describe('ai-customer-public-self-service.logic (parity-2.3)', () => {
  it('dispatches public account and gift-card intents', async () => {
    const payments = {
      handleBuyGiftCard: jest.fn().mockReturnValue({
        success: true,
        action: 'buy_gift_card',
        summary: 'Gift card checkout',
      }),
    };
    const crm = {
      handleMyProfile: jest.fn().mockReturnValue({
        success: true,
        action: 'my_profile',
        summary: 'Profile',
      }),
      handleMyAppointments: jest.fn(),
      handleMySubscriptions: jest.fn(),
      handleSubscriptionUsage: jest.fn(),
      handleMyGiftCards: jest.fn(),
      handleGiftCardBalance: jest.fn(),
      handleDiscoverPackages: jest.fn(),
      handleDiscoverSubscriptionPlans: jest.fn(),
      handleDiscoverGiftCardProducts: jest.fn(),
    };
    const marketing = { handleLoyaltyPointsBalance: jest.fn() };

    expect(
      (
        await dispatchPublicSelfServiceIntent(
          { payments, crm, marketing },
          'biz-1',
          'buy_gift_card',
          { amount: 50 },
        )
      )?.action,
    ).toBe('buy_gift_card');
    expect(payments.handleBuyGiftCard).toHaveBeenCalledWith(
      'biz-1',
      { amount: 50 },
      false,
    );

    expect(
      (
        await dispatchPublicSelfServiceIntent(
          { payments, crm, marketing },
          'biz-1',
          'my_profile',
          { sessionCustomerId: 'cust-1' },
        )
      )?.action,
    ).toBe('my_profile');
    expect(crm.handleMyProfile).toHaveBeenCalledWith('biz-1', {
      sessionCustomerId: 'cust-1',
    });

    expect(
      await dispatchPublicSelfServiceIntent(
        { payments, crm, marketing },
        'biz-1',
        'create_booking',
        {},
      ),
    ).toBeNull();
  });
});
