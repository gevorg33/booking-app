import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import {
  handleExplainMyNotificationsLogic,
  handleReferAFriendLogic,
  handleShareSalonLinkLogic,
} from './ai-consumer-adoption.logic.js';
import { handleFindMySavedSalonsLogic } from './ai-find-my-saved-salons.logic.js';
import { handleRebookLastAppointmentLogic } from './ai-rebook-last-appointment.logic.js';
import { DEFAULT_BUSINESS_NOTIFICATION_SETTINGS } from '../notifications/notification.types.js';

const businessRepo = {
  findOne: jest.fn(async () =>
    makeBusiness({ id: 'biz-1', slug: 'demo-salon' }),
  ),
};

describe('ai-consumer-adoption.logic', () => {
  beforeEach(() => {
    businessRepo.findOne.mockClear();
  });

  it('explains notifications from salon settings and customer prefs', async () => {
    const result = await handleExplainMyNotificationsLogic(
      {
        publicCustomerAuthService: {
          getCustomerById: jest.fn(async () => ({
            metadata: {
              notifications: {
                emailReminders: true,
                smsReminders: false,
                whatsappReminders: true,
                pushReminders: true,
                pushOffers: false,
                pushNews: false,
              },
            },
          })),
        } as any,
        publicBookingService: {} as any,
        pushNotifications: {} as any,
        notificationsService: {
          getBusinessSettings: jest.fn(async () => ({
            ...DEFAULT_BUSINESS_NOTIFICATION_SETTINGS,
            smsEnabled: false,
          })),
        } as any,
        businessRepo: businessRepo as any,
      },
      'biz-1',
      { sessionCustomerId: 'cust-1' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_my_notifications');
    expect(result.summary).toContain('WhatsApp');
    expect(result.details?.reminders).toEqual(
      expect.arrayContaining([expect.stringMatching(/WhatsApp reminder/i)]),
    );
    expect(result.details?.navigate).toMatchObject({
      path: 'account',
      query: { section: 'notifications' },
    });
  });

  it('requires sign-in for explain_my_notifications', async () => {
    const result = await handleExplainMyNotificationsLogic(
      {
        publicCustomerAuthService: {} as any,
        publicBookingService: {} as any,
        pushNotifications: {} as any,
        notificationsService: {} as any,
        businessRepo: businessRepo as any,
      },
      'biz-1',
      {},
    );
    expect(result.success).toBe(false);
  });

  // e2e-bug.125
  it('returns referral code without params.slug via businessId lookup', async () => {
    const getCustomerReferralProgram = jest.fn(async () => ({
      referralCode: 'ABC12345',
      shareUrl: 'https://book.example/s/demo?ref=ABC12345',
      enabled: true,
      referrerBonusPoints: 100,
      refereeBonusPoints: 50,
      refereePromoCode: null,
      conversionsCount: 0,
      referrerRewardSummary: '100 points',
    }));
    const result = await handleReferAFriendLogic(
      {
        publicCustomerAuthService: {} as any,
        publicBookingService: { getCustomerReferralProgram } as any,
        pushNotifications: {} as any,
        notificationsService: {} as any,
        consumerPushTokenService: {} as any,
        businessRepo: businessRepo as any,
      },
      'biz-1',
      { sessionCustomerId: 'cust-1' },
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('ABC12345');
    expect(businessRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'biz-1' },
    });
    expect(getCustomerReferralProgram).toHaveBeenCalledWith(
      'demo-salon',
      'cust-1',
    );
  });

  it('shares salon link without params.slug via businessId lookup', async () => {
    const getCustomerShareRewards = jest.fn(async () => ({
      salonShareEnabled: true,
      salonRewardSummary: '50 points',
    }));
    const result = await handleShareSalonLinkLogic(
      {
        publicCustomerAuthService: {} as any,
        publicBookingService: { getCustomerShareRewards } as any,
        pushNotifications: {} as any,
        notificationsService: {} as any,
        consumerPushTokenService: {} as any,
        businessRepo: businessRepo as any,
      },
      'biz-1',
      { sessionCustomerId: 'cust-1' },
    );
    expect(result.success).toBe(true);
    expect(getCustomerShareRewards).toHaveBeenCalledWith(
      'demo-salon',
      'cust-1',
    );
  });

  it('lists saved salons from client context', async () => {
    const result = await handleFindMySavedSalonsLogic(
      {
        recentSalons: [{ slug: 'demo-salon', name: 'Demo Salon' }],
      },
      'Show my saved salons',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('find_my_saved_salons');
    expect(result.details?.recentSalons).toHaveLength(1);
    expect(result.details?.navigate).toMatchObject({ path: 'tenant_switch' });
  });

  it('rebooks the last completed visit', async () => {
    const result = await handleRebookLastAppointmentLogic(
      {
        publicCustomerAuthService: {
          listBookings: jest.fn(async () => ({
            bookings: [
              {
                id: 'b1',
                serviceId: 'svc-1',
                serviceName: 'Haircut',
                employeeId: 'emp-1',
                employeeName: 'Alex',
                startTime: '2026-05-01T10:00:00.000Z',
                status: BookingStatus.COMPLETED,
              },
            ],
          })),
        } as any,
        publicBookingService: {} as any,
        pushNotifications: {} as any,
        notificationsService: {} as any,
        businessRepo: businessRepo as any,
      },
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        slug: 'demo-salon',
      },
      'Book the same as last time',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('rebook_last_appointment');
    expect(result.details?.navigate).toMatchObject({
      path: 'checkout',
      query: expect.objectContaining({
        serviceId: 'svc-1',
        rebook: '1',
        rebookSource: 'account',
      }),
    });
  });
});
