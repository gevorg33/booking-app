import { PublicBookingService } from './public-booking.service.js';

describe('PublicBookingService referral program (adopt-6.1)', () => {
  const business = {
    id: 'biz-1',
    slug: 'demo-salon',
    name: 'Demo Salon',
    isActive: true,
    subscriptionPlanId: 'starter',
    subscriptionStatus: 'active',
    settings: {
      referralProgram: {
        enabled: true,
        referrerBonusPoints: 25,
        refereeBonusPoints: 25,
        refereePromoCode: 'FRIEND10',
      },
    },
  };

  const businessService = {
    findBySlug: jest.fn().mockResolvedValue(business),
  };

  const referralProgramService = {
    getReferralProgramView: jest.fn().mockResolvedValue({
      referralCode: 'A1B2C3D4',
      shareUrl: 'https://app.test/book/demo-salon?ref=A1B2C3D4&src=referral',
      enabled: true,
      referrerBonusPoints: 25,
      refereeBonusPoints: 25,
      refereePromoCode: 'FRIEND10',
      conversionsCount: 2,
    }),
    claimReferralCode: jest.fn().mockResolvedValue({
      attached: true,
      referralCode: 'A1B2C3D4',
      referrerCustomerId: 'referrer-1',
    }),
  };

  const service = new PublicBookingService(
    businessService as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { get: jest.fn() } as never,
    referralProgramService as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns referral program view for signed-in customer', async () => {
    await expect(
      service.getCustomerReferralProgram('demo-salon', 'cust-1'),
    ).resolves.toEqual(
      expect.objectContaining({
        referralCode: 'A1B2C3D4',
        shareUrl: expect.stringContaining('ref=A1B2C3D4'),
        refereePromoCode: 'FRIEND10',
        conversionsCount: 2,
      }),
    );
    expect(referralProgramService.getReferralProgramView).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
    );
  });

  it('claims referral code for signed-in customer', async () => {
    await expect(
      service.claimCustomerReferralCode('demo-salon', 'referee-1', 'A1B2C3D4'),
    ).resolves.toEqual(
      expect.objectContaining({
        attached: true,
        referrerCustomerId: 'referrer-1',
      }),
    );
    expect(referralProgramService.claimReferralCode).toHaveBeenCalledWith(
      'biz-1',
      'referee-1',
      'A1B2C3D4',
    );
  });

  it('rejects inactive business slug', async () => {
    businessService.findBySlug.mockResolvedValueOnce({
      ...business,
      isActive: false,
    });
    await expect(
      service.getCustomerReferralProgram('demo-salon', 'cust-1'),
    ).rejects.toThrow('not accepting bookings');
  });
});
