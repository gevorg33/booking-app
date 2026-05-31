import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MultiServiceBookingsService } from './multi-service-bookings.service.js';

describe('MultiServiceBookingsService', () => {
  const groupRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({ id: 'group-1', ...v })),
  };
  const businessRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (v) => v),
  };
  const serviceRepo = {
    find: jest.fn(),
  };

  const service = new MultiServiceBookingsService(
    groupRepo as any,
    businessRepo as any,
    serviceRepo as any,
  );

  const business = {
    id: 'biz-1',
    settings: {
      publicBooking: {
        multiService: {
          enabled: true,
          maxServiceCount: 3,
          maxDurationMinutes: 180,
          turnoverBufferMinutes: 5,
          schedulingMode: 'same_visit',
          incompatiblePairs: [],
        },
      },
    },
  };

  const loadedServices = [
    { id: 'svc-1', name: 'Haircut', price: 40, durationMinutes: 30, bufferMinutes: 0, currency: 'USD' },
    { id: 'svc-2', name: 'Beard', price: 25, durationMinutes: 20, bufferMinutes: 0, currency: 'USD' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: JSON.parse(JSON.stringify(business.settings)),
    });
    serviceRepo.find.mockResolvedValue(loadedServices);
  });

  it('returns and updates settings', async () => {
    const settings = await service.getSettings('biz-1');
    expect(settings.enabled).toBe(true);

    const updated = await service.updateSettings('biz-1', { enabled: true, maxServiceCount: 4 });
    expect(updated.maxServiceCount).toBe(4);
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('previews valid multi-service totals', async () => {
    const preview = await service.previewTotals('biz-1', ['svc-1', 'svc-2']);
    expect(preview.valid).toBe(true);
    expect(preview.totals?.totalPrice).toBe(65);
    expect(preview.services).toHaveLength(2);
  });

  it('rejects disabled multi-service booking', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: { publicBooking: { multiService: { enabled: false } } },
    });
    await expect(service.validateSelection('biz-1', ['svc-1', 'svc-2'])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('creates booking groups', async () => {
    const group = await service.createGroup({
      businessId: 'biz-1',
      customerId: 'cust-1',
      schedulingMode: 'same_visit',
      totals: { blockDurationMinutes: 55, totalPrice: 65, currency: 'USD' },
      blockStartTime: new Date('2026-06-03T10:00:00Z'),
      primaryEmployeeId: 'emp-1',
    });
    expect(group.id).toBe('group-1');
    expect(groupRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        totalPrice: 65,
        primaryEmployeeId: 'emp-1',
      }),
    );
  });

  it('throws when business is missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.getSettings('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('validates selection directly and rejects invalid preview', async () => {
    const validation = await service.validateSelection('biz-1', ['svc-1', 'svc-2']);
    expect(validation.valid).toBe(true);

    await expect(service.previewTotals('biz-1', ['svc-1'])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('exposes settings from a business entity', () => {
    expect(service.resolveSettingsFromBusiness(business as any).enabled).toBe(true);
  });

  it('updates all settings fields', async () => {
    await service.updateSettings('biz-1', {
      enabled: true,
      maxServiceCount: 5,
      maxDurationMinutes: 200,
      turnoverBufferMinutes: 8,
      schedulingMode: 'per_service',
      incompatiblePairs: [['svc-1', 'svc-2']],
    });
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          publicBooking: expect.objectContaining({
            multiService: expect.objectContaining({
              schedulingMode: 'per_service',
              incompatiblePairs: [['svc-1', 'svc-2']],
            }),
          }),
        }),
      }),
    );
  });

  it('rejects preview when a selected service is missing', async () => {
    serviceRepo.find.mockResolvedValue([loadedServices[0]]);
    await expect(service.previewTotals('biz-1', ['svc-1', 'svc-2'])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updates settings when business settings are empty', async () => {
    businessRepo.findOne.mockResolvedValue({ id: 'biz-1', settings: undefined });
    await service.updateSettings('biz-1', { enabled: true });
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('creates groups with default optional fields', async () => {
    await service.createGroup({
      businessId: 'biz-1',
      customerId: 'cust-1',
      schedulingMode: 'per_service',
      totals: { blockDurationMinutes: 50, totalPrice: 65, currency: 'USD' },
    });
    expect(groupRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        blockStartTime: null,
        primaryEmployeeId: null,
        metadata: {},
      }),
    );
  });

  it('throws when updating settings for missing business', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.updateSettings('missing', { enabled: true })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('handles empty service id lists and default service currency', async () => {
    const emptyValidation = await service.validateSelection('biz-1', []);
    expect(emptyValidation.valid).toBe(false);

    serviceRepo.find.mockResolvedValue([
      { ...loadedServices[0], currency: null },
      loadedServices[1],
    ]);
    const preview = await service.previewTotals('biz-1', ['svc-1', 'svc-2']);
    expect(preview.totals?.currency).toBe('USD');
  });
});
