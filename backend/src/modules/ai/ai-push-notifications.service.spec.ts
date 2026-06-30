import { AiPushNotificationsService } from './ai-push-notifications.service.js';

describe('AiPushNotificationsService', () => {
  const notificationsService = {
    getBusinessSettings: jest.fn(async () => ({
      pushManagerAlertsEnabled: true,
      pushAdditionalRecipientUserIds: [],
    })),
    updateBusinessSettings: jest.fn(async (_, patch) => patch),
  };
  const whatsappIntegrationService = {
    getPublicSettings: jest.fn(async () => ({ configured: false })),
    updateSettings: jest.fn(async (_id, patch) => patch),
  };
  const pushService = {
    isConfigured: true,
    sendToUser: jest.fn(async () => 1),
  };
  const providerMobileService = {};
  const bookingRepo = {
    findOne: jest.fn(async () => null),
    find: jest.fn(async () => []),
  };
  const businessRepo = { findOne: jest.fn(async () => ({ settings: {} })) };
  const customerRepo = {
    findOne: jest.fn(async () => null),
    save: jest.fn(async (c) => c),
  };
  const employeeRepo = { find: jest.fn(async () => []) };
  const notificationLogRepo = { find: jest.fn(async () => []) };

  let service: AiPushNotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiPushNotificationsService(
      notificationsService as any,
      whatsappIntegrationService as any,
      pushService as any,
      providerMobileService as any,
      bookingRepo as any,
      businessRepo as any,
      customerRepo as any,
      employeeRepo as any,
      notificationLogRepo as any,
    );
  });

  it('delegates rescue, compound, and handlers', () => {
    expect(
      service.rescuePushNotificationsIntent('Explain last push', 'unknown')
        ?.action,
    ).toBe('explain_last_push');
    expect(
      service.isPushNotificationsCompound(
        'Explain last push and offline queue status',
      ),
    ).toBe(true);
    expect(
      service.decomposePushNotificationsCompound(
        'Explain last push and dismiss push',
      ).length,
    ).toBe(2);
  });

  it('delegates async handlers', async () => {
    expect((await service.handleNewBookingPushActions()).action).toBe(
      'new_booking_push_actions',
    );
    expect(
      (await service.handleOfflineQueueStatus({ offlineQueueCount: 0 })).action,
    ).toBe('offline_queue_status');
    expect((await service.handleNotificationHistory('biz-1', {})).action).toBe(
      'notification_history',
    );
  });
});
