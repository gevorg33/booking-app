import { BadRequestException, HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppEventService } from './app-event.service.js';
import { AppEvent } from './entities/app-event.entity.js';
import { BusinessService } from '../business/business.service.js';
import { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';

describe('AppEventService', () => {
  const saved: AppEvent[] = [];
  const appEventRepo = {
    create: (payload: Partial<AppEvent>) => payload,
    save: async (entity: Partial<AppEvent>) => {
      const row = {
        id: `evt-${saved.length + 1}`,
        createdAt: new Date(),
        ...entity,
      } as AppEvent;
      saved.push(row);
      return row;
    },
    find: async () => saved,
  };
  const businessService = {
    findBySlug: jest.fn().mockResolvedValue({ id: 'biz-1', slug: 'salon-a' }),
  };
  const consumerPushTokens = {
    getDeliverabilityAggregate: jest.fn().mockResolvedValue({
      deliverySuccessCount: 0,
      deliveryFailureCount: 0,
      silentFailureCount: 0,
    }),
  };

  let service: AppEventService;

  beforeEach(async () => {
    saved.length = 0;
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AppEventService,
        { provide: getRepositoryToken(AppEvent), useValue: appEventRepo },
        { provide: BusinessService, useValue: businessService },
        { provide: ConsumerPushTokenService, useValue: consumerPushTokens },
      ],
    }).compile();
    service = moduleRef.get(AppEventService);
  });

  it('requires consent before recording events', async () => {
    await expect(
      service.ingestEvents({
        consentGranted: false,
        tenantSlug: 'salon-a',
        events: [
          {
            event: 'app_opened',
            anonId: 'anon-1',
            platform: 'ios',
            appSurface: 'consumer_app',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records batched events for tenant slug', async () => {
    const result = await service.ingestEvents({
      consentGranted: true,
      tenantSlug: 'salon-a',
      events: [
        {
          event: 'app_opened',
          anonId: 'anon-1',
          platform: 'ios',
          appSurface: 'consumer_app',
          locale: 'en',
        },
        {
          event: 'signed_in',
          anonId: 'anon-1',
          platform: 'ios',
          appSurface: 'consumer_app',
        },
      ],
    });
    expect(result.recorded).toBe(2);
    expect(saved).toHaveLength(2);
  });

  it('skips invalid events during ingest', async () => {
    const result = await service.ingestEvents({
      consentGranted: true,
      businessId: 'biz-1',
      events: [
        {
          event: 'not_real',
          anonId: 'anon-1',
          platform: 'ios',
          appSurface: 'consumer_app',
        },
      ],
    });
    expect(result.recorded).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('requires business id or tenant slug', async () => {
    await expect(
      service.ingestEvents({
        consentGranted: true,
        events: [
          {
            event: 'app_opened',
            anonId: 'anon-1',
            platform: 'ios',
            appSurface: 'consumer_app',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns adoption dashboard metrics', async () => {
    await service.ingestEvents({
      consentGranted: true,
      businessId: 'biz-1',
      events: [
        {
          event: 'app_installed',
          anonId: 'anon-dash',
          platform: 'ios',
          appSurface: 'consumer_app',
        },
        {
          event: 'app_opened',
          anonId: 'anon-dash',
          platform: 'ios',
          appSurface: 'consumer_app',
        },
        {
          event: 'signed_in',
          anonId: 'anon-dash',
          platform: 'ios',
          appSurface: 'consumer_app',
        },
        {
          event: 'completed_booking',
          anonId: 'anon-dash',
          platform: 'ios',
          appSurface: 'consumer_app',
          props: { bookingId: 'b-1' },
        },
      ],
    });

    const dashboard = await service.getAdoptionDashboard('biz-1', 30);
    expect(dashboard.funnel.steps[0]?.count).toBeGreaterThanOrEqual(1);
    expect(dashboard.activation.installedCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.exitGate.periodDays).toBe(30);
    expect(dashboard.exitGate.criteria.length).toBeGreaterThanOrEqual(7);
  });

  it('redacts PII and non-allowlisted props before persisting (adopt-1.3)', async () => {
    await service.ingestEvents({
      consentGranted: true,
      businessId: 'biz-1',
      events: [
        {
          event: 'completed_booking',
          anonId: 'anon-redact',
          platform: 'ios',
          appSurface: 'consumer_app',
          props: {
            email: 'user@example.com',
            bookingId: 'bk-1',
            pushOptIn: true,
            ignoredField: 'drop-me',
          },
        },
      ],
    });

    expect(saved[0]?.props).toEqual({ bookingId: 'bk-1', pushOptIn: true });
    expect(saved[0]?.anonId).toBe('anon-redact');
  });

  it('persists full sink row with session context (adopt-1.3)', async () => {
    await service.ingestEvents({
      consentGranted: true,
      businessId: 'biz-1',
      events: [
        {
          event: 'app_opened',
          anonId: 'anon-sink',
          platform: 'android',
          appSurface: 'provider_app',
          appVersion: '2.0.1',
          locale: 'hy',
          tenantSlug: 'salon-a',
          sessionId: 'sess-xyz',
          startType: 'warm',
          userType: 'returning',
        },
      ],
    });

    expect(saved[0]).toMatchObject({
      businessId: 'biz-1',
      event: 'app_opened',
      platform: 'android',
      appSurface: 'provider_app',
      appVersion: '2.0.1',
      locale: 'hy',
      tenantSlug: 'salon-a',
      sessionId: 'sess-xyz',
      startType: 'warm',
      userType: 'returning',
    });
  });

  it('enforces per-anon rate limits', async () => {
    const events = Array.from({ length: 101 }, (_, index) => ({
      event: 'app_opened',
      anonId: 'anon-rate',
      platform: 'web',
      appSurface: 'public_web',
      sessionId: `s-${index}`,
    }));

    await expect(
      service.ingestEvents({
        consentGranted: true,
        businessId: 'biz-1',
        events,
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
