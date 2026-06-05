import { ZendeskCustomerSyncListener } from './zendesk-customer-sync.listener.js';
import { ZendeskIntegrationService } from './zendesk-integration.service.js';

describe('ZendeskCustomerSyncListener', () => {
  const zendesk = {
    syncCustomerIfEnabled: jest.fn(),
  };

  const listener = new ZendeskCustomerSyncListener(
    zendesk as unknown as ZendeskIntegrationService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('syncs customer on customer.upserted event', async () => {
    zendesk.syncCustomerIfEnabled.mockResolvedValue({ userId: 1 });
    await listener.handleCustomerUpsert({
      businessId: 'biz-1',
      customerId: 'cust-1',
    });
    expect(zendesk.syncCustomerIfEnabled).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
    );
  });

  it('swallows sync errors without rethrowing', async () => {
    zendesk.syncCustomerIfEnabled.mockRejectedValue(new Error('Zendesk down'));
    await expect(
      listener.handleCustomerUpsert({
        businessId: 'biz-1',
        customerId: 'cust-1',
      }),
    ).resolves.toBeUndefined();
  });

  it('swallows sync errors without message property', async () => {
    zendesk.syncCustomerIfEnabled.mockRejectedValue({});
    await expect(
      listener.handleCustomerUpsert({
        businessId: 'biz-1',
        customerId: 'cust-1',
      }),
    ).resolves.toBeUndefined();
  });
});
