import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZapierIntegrationService } from './zapier-integration.service.js';
import { WebhooksService } from '../webhooks.service.js';

describe('ZapierIntegrationService', () => {
  const businessRepo = { findOne: jest.fn(), save: jest.fn() };
  const webhooksService = { createSubscription: jest.fn() };
  const config = {
    get: jest.fn((key: string) =>
      key === 'API_PUBLIC_URL' ? 'https://api.test' : undefined,
    ),
  };

  const service = new ZapierIntegrationService(
    businessRepo as any,
    webhooksService as unknown as WebhooksService,
    config as unknown as ConfigService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.save.mockImplementation(async (b: unknown) => b);
    businessRepo.findOne.mockResolvedValue({ id: 'biz-1', settings: {} });
    webhooksService.createSubscription.mockResolvedValue({
      id: 'wh-1',
      secret: 'sec',
    });
  });

  it('returns connector settings', async () => {
    const view = await service.getPublicSettings('biz-1');
    expect(view.apiBaseUrl).toBe('https://api.test');
    expect(view.webhookEvents.length).toBeGreaterThan(0);
    expect(view.setupSteps.length).toBeGreaterThan(0);
  });

  it('throws when business missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.getPublicSettings('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates zapier settings', async () => {
    const view = await service.updateSettings('biz-1', {
      enabled: true,
      hookDescription: 'Zap to CRM',
    });
    expect(view.enabled).toBe(true);
    expect(view.hookDescription).toBe('Zap to CRM');
  });

  it('creates webhook via webhooks service', async () => {
    const result = await service.createZapierWebhook(
      'biz-1',
      'https://hooks.zapier.com/x',
      ['booking.created'],
    );
    expect(webhooksService.createSubscription).toHaveBeenCalled();
    expect(result.secret).toBe('sec');
  });

  it('clears hook description when empty', async () => {
    const view = await service.updateSettings('biz-1', {
      hookDescription: '   ',
    });
    expect(view.hookDescription).toBeUndefined();
  });

  it('throws on update when business missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(
      service.updateSettings('x', { enabled: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uses default api url when env unset', async () => {
    const localConfig = { get: jest.fn(() => undefined) };
    const localService = new ZapierIntegrationService(
      businessRepo as any,
      webhooksService as unknown as WebhooksService,
      localConfig as unknown as ConfigService,
    );
    businessRepo.findOne.mockResolvedValue({ id: 'biz-1', settings: {} });
    const view = await localService.getPublicSettings('biz-1');
    expect(view.apiBaseUrl).toBe('http://localhost:3001');
  });

  it('returns sample payloads', () => {
    const samples = service.samplePayloads('biz-1');
    expect(samples[0].event).toBe('booking.created');
  });
});
