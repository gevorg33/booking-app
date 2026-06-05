import { MultiServiceBookingsService } from './multi-service-bookings.service.js';

describe('Sprint 28 — multi-service currency integration', () => {
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: {
        currency: 'AMD',
        publicBooking: { multiService: { enabled: true } },
      },
    })),
    save: jest.fn(),
  };

  const serviceRepo = {
    find: jest.fn(async () => [
      {
        id: 'svc-1',
        name: 'Cut',
        durationMinutes: 30,
        bufferMinutes: 0,
        price: 5000,
        currency: null,
        categoryId: null,
      },
      {
        id: 'svc-2',
        name: 'Color',
        durationMinutes: 60,
        bufferMinutes: 0,
        price: 15000,
        currency: 'EUR',
        categoryId: null,
      },
    ]),
  };

  const service = new MultiServiceBookingsService(
    {} as never,
    businessRepo as never,
    serviceRepo as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves per-service currency with business default fallback', async () => {
    const lines = await service.loadServicesForSelection('biz-1', [
      'svc-1',
      'svc-2',
    ]);

    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ serviceId: 'svc-1', currency: 'AMD' }),
        expect.objectContaining({ serviceId: 'svc-2', currency: 'EUR' }),
      ]),
    );
  });

  it('previewTotals uses resolved currency from first service line', async () => {
    const preview = await service.previewTotals('biz-1', ['svc-1', 'svc-2']);

    expect(preview.totals?.currency).toBe('AMD');
    expect(preview.totals?.totalPrice).toBe(20000);
  });
});
