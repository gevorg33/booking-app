import { BadRequestException, HttpException } from '@nestjs/common';
import { AppEventController } from './app-event.controller.js';
import { AppEventService } from './app-event.service.js';

describe('AppEventController integration (adopt-1.3)', () => {
  const appEventService = {
    ingestEvents: jest.fn(),
  } as unknown as AppEventService;

  const controller = new AppEventController(appEventService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /events/app delegates batched ingest to the sink service', async () => {
    appEventService.ingestEvents = jest
      .fn()
      .mockResolvedValue({ recorded: 2, skipped: 0 });

    const result = await controller.ingest({
      consentGranted: true,
      tenantSlug: 'salon-a',
      events: [
        {
          event: 'app_opened',
          anonId: 'anon-1',
          platform: 'ios',
          appSurface: 'consumer_app',
          sessionId: 'sess-1',
          startType: 'cold',
          userType: 'first_open',
        },
        {
          event: 'signed_in',
          anonId: 'anon-1',
          platform: 'ios',
          appSurface: 'consumer_app',
        },
      ],
    });

    expect(appEventService.ingestEvents).toHaveBeenCalledWith({
      consentGranted: true,
      tenantSlug: 'salon-a',
      events: expect.any(Array),
    });
    expect(result).toEqual({ recorded: 2, skipped: 0 });
  });

  it('surfaces consent failures from the sink service', async () => {
    appEventService.ingestEvents = jest
      .fn()
      .mockRejectedValue(
        new BadRequestException('Analytics consent is required'),
      );

    await expect(
      controller.ingest({
        consentGranted: false,
        tenantSlug: 'salon-a',
        events: [
          {
            event: 'app_opened',
            anonId: 'anon-1',
            platform: 'web',
            appSurface: 'public_web',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('surfaces rate-limit failures from the sink service', async () => {
    appEventService.ingestEvents = jest
      .fn()
      .mockRejectedValue(
        new HttpException('App event rate limit exceeded', 429),
      );

    await expect(
      controller.ingest({
        consentGranted: true,
        businessId: 'biz-1',
        events: [
          {
            event: 'app_opened',
            anonId: 'anon-rate',
            platform: 'web',
            appSurface: 'public_web',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
