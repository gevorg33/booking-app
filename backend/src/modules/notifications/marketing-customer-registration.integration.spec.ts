import { Test } from '@nestjs/testing';
import { MarketingCustomerRegistrationListener } from './marketing-customer-registration.listener.js';
import { NotificationsService } from './notifications.service.js';

describe('Sprint 12.b marketing customer registration', () => {
  const notificationsService = {
    sendMarketingNewCustomerRegistration: jest.fn().mockResolvedValue(undefined),
  };

  const listener = new MarketingCustomerRegistrationListener(
    notificationsService as unknown as NotificationsService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates customer.registered to notifications service', async () => {
    await listener.handleCustomerRegistered({
      businessId: 'biz-1',
      customerId: 'cust-1',
      source: 'web_booking',
    });
    expect(notificationsService.sendMarketingNewCustomerRegistration).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
      'web_booking',
    );
  });

  it('swallows notification errors without rethrowing', async () => {
    notificationsService.sendMarketingNewCustomerRegistration.mockRejectedValue(
      new Error('smtp down'),
    );
    await expect(
      listener.handleCustomerRegistered({
        businessId: 'biz-1',
        customerId: 'cust-1',
        source: 'dashboard',
      }),
    ).resolves.toBeUndefined();
  });

  it('instantiates through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MarketingCustomerRegistrationListener,
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();
    const injected = moduleRef.get(MarketingCustomerRegistrationListener);
    await injected.handleCustomerRegistered({
      businessId: 'biz-1',
      customerId: 'cust-1',
      source: 'dashboard',
    });
    expect(notificationsService.sendMarketingNewCustomerRegistration).toHaveBeenCalled();
    await moduleRef.close();
  });

  it('formats non-Error failures in the warning log', async () => {
    notificationsService.sendMarketingNewCustomerRegistration.mockRejectedValue('smtp down');
    await expect(
      listener.handleCustomerRegistered({
        businessId: 'biz-1',
        customerId: 'cust-1',
        source: 'app',
      }),
    ).resolves.toBeUndefined();
  });
});
