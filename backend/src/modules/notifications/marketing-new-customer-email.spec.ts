import { NotificationsService } from './notifications.service.js';
import { mergeBusinessNotificationSettings } from './notification.types.js';

describe('NotificationsService.sendMarketingNewCustomerRegistration', () => {
  const bookingRepo = { findOne: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const customerRepo = { findOne: jest.fn() };
  const logRepo = { findOne: jest.fn(), save: jest.fn() };
  const emailService = { send: jest.fn().mockResolvedValue({ ok: true }) };

  const service = new NotificationsService(
    bookingRepo as any,
    businessRepo as any,
    customerRepo as any,
    logRepo as any,
    emailService as any,
    { send: jest.fn() } as any,
    { send: jest.fn() } as any,
    { resolveRuntimeConfig: jest.fn() } as any,
    {
      get: jest.fn((key: string) =>
        key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
      ),
    } as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Glow Salon',
      settings: {
        notifications: mergeBusinessNotificationSettings({
          emailEnabled: true,
          emailOnNewCustomerRegistration: true,
          marketingTeamEmails: ['marketing@test.com', 'marketing@test.com'],
        }),
      },
    });
    customerRepo.findOne.mockResolvedValue({
      id: 'cust-1',
      businessId: 'biz-1',
      isActive: true,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+15551234',
    });
  });

  it('sends profile email to each marketing recipient', async () => {
    await service.sendMarketingNewCustomerRegistration(
      'biz-1',
      'cust-1',
      'dashboard',
    );
    expect(emailService.send).toHaveBeenCalledTimes(1);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'marketing@test.com',
        subject: expect.stringContaining('Jane Doe'),
        text: expect.stringContaining('Dashboard'),
      }),
    );
  });

  it('skips when toggle is off', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Glow Salon',
      settings: {
        notifications: mergeBusinessNotificationSettings({
          emailOnNewCustomerRegistration: false,
          marketingTeamEmails: ['marketing@test.com'],
        }),
      },
    });
    await service.sendMarketingNewCustomerRegistration(
      'biz-1',
      'cust-1',
      'app',
    );
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('skips when no marketing recipients configured', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Glow Salon',
      settings: { notifications: mergeBusinessNotificationSettings({}) },
    });
    await service.sendMarketingNewCustomerRegistration(
      'biz-1',
      'cust-1',
      'web_booking',
    );
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('skips when business is missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await service.sendMarketingNewCustomerRegistration(
      'biz-1',
      'cust-1',
      'app',
    );
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('skips when customer is missing', async () => {
    customerRepo.findOne.mockResolvedValue(null);
    await service.sendMarketingNewCustomerRegistration(
      'biz-1',
      'cust-1',
      'dashboard',
    );
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('skips when email channel is disabled', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Glow Salon',
      settings: {
        notifications: mergeBusinessNotificationSettings({
          emailEnabled: false,
          emailOnNewCustomerRegistration: true,
          marketingTeamEmails: ['marketing@test.com'],
        }),
      },
    });
    await service.sendMarketingNewCustomerRegistration(
      'biz-1',
      'cust-1',
      'web_booking',
    );
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('logs when a recipient send fails', async () => {
    emailService.send
      .mockResolvedValueOnce({ ok: false, error: 'rate limited' })
      .mockResolvedValueOnce({ ok: true });
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Glow Salon',
      settings: {
        notifications: mergeBusinessNotificationSettings({
          emailEnabled: true,
          emailOnNewCustomerRegistration: true,
          marketingTeamEmails: ['one@test.com', 'two@test.com'],
        }),
      },
    });
    await service.sendMarketingNewCustomerRegistration(
      'biz-1',
      'cust-1',
      'app',
    );
    expect(emailService.send).toHaveBeenCalledTimes(2);
  });

  it('formats web_booking and app source labels', async () => {
    await service.sendMarketingNewCustomerRegistration(
      'biz-1',
      'cust-1',
      'web_booking',
    );
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('Web booking') }),
    );
    jest.clearAllMocks();
    await service.sendMarketingNewCustomerRegistration(
      'biz-1',
      'cust-1',
      'app',
    );
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Google sign-in'),
      }),
    );
  });
});
