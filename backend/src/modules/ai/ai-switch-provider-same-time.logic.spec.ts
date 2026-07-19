import { formatTimeDisplay } from '../../common/utils/date-format.util.js';
import {
  buildSwitchProviderSameTimeSummary,
  handleSwitchProviderSameTimeLogic,
} from './ai-switch-provider-same-time.logic.js';

describe('ai-switch-provider-same-time.logic (ai-cmd-customer-4.11.4)', () => {
  const startTime = '2026-07-01T15:00:00.000Z';
  const timeSlot = formatTimeDisplay(startTime);

  const employeeRepo = {
    find: jest.fn(async () => [
      { id: 'emp-anna', name: 'Anna', businessId: 'biz-1', isActive: true },
    ]),
  };
  const serviceRepo = {
    findOne: jest.fn(async () => ({
      id: 'svc-haircut',
      name: 'Haircut',
      businessId: 'biz-1',
      isActive: true,
    })),
  };
  const publicBookingService = {
    getServiceDaySlots: jest.fn(async () => ({
      date: '2026-07-01',
      serviceId: 'svc-haircut',
      serviceName: 'Haircut',
      slots: [
        {
          startTime,
          endTime: '2026-07-01T16:00:00.000Z',
          employeeId: 'emp-anna',
          employeeName: 'Anna',
        },
      ],
    })),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'salon' })),
  };
  const switchDeps = () => ({
    employeeRepo,
    serviceRepo,
    publicBookingService,
    businessRepo,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds summary variants', () => {
    expect(
      buildSwitchProviderSameTimeSummary({
        mode: 'keep_time_any_provider',
        employeeName: 'Anna',
        timeSlot: '15:00',
        serviceName: 'Haircut',
      }),
    ).toContain('Haircut');
    expect(
      buildSwitchProviderSameTimeSummary({
        mode: 'keep_time_named_provider',
        employeeName: 'Anna',
        timeSlot: '15:00',
      }),
    ).toContain('Switched to Anna');
    expect(
      buildSwitchProviderSameTimeSummary({
        mode: 'keep_time_any_provider',
        employeeName: 'Anna',
        timeSlot: '15:00',
      }),
    ).toContain('Found Anna');
  });

  it('fails when prompt is not recognized', async () => {
    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      { slug: 'salon' },
      'Book with Anna for color',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails when business slug cannot be resolved', async () => {
    const result = await handleSwitchProviderSameTimeLogic(
      {
        ...switchDeps(),
        businessRepo: { findOne: jest.fn(async () => null) },
      },
      'biz-1',
      { serviceId: 'svc-haircut', date: '2026-07-01', timeSlot },
      'Keep 3pm but different stylist',
    );
    expect(result.summary).toContain('Business not found');
  });

  it('resolves slug from businessId when params.slug is omitted (e2e-bug.82)', async () => {
    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      { serviceId: 'svc-haircut', date: '2026-07-01', timeSlot },
      'Keep 3pm but different stylist',
    );
    expect(result.success).toBe(true);
    expect(result.details?.employeeId).toBe('emp-anna');
  });

  it('fails without date', async () => {
    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      { slug: 'salon', serviceId: 'svc-haircut', timeSlot },
      'Keep 3pm but different stylist',
    );
    expect(result.details?.missing).toContain('date');
  });

  it('fails without time slot', async () => {
    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      {
        slug: 'salon',
        serviceId: 'svc-haircut',
        date: '2026-07-01',
        startTime: '',
      },
      'Same time but a different provider',
    );
    expect(result.details?.missing).toContain('timeSlot');
  });

  it('fails when named provider is unknown', async () => {
    employeeRepo.find.mockResolvedValueOnce([]);
    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      {
        slug: 'salon',
        serviceId: 'svc-haircut',
        date: '2026-07-01',
        timeSlot,
      },
      'Keep 3pm but switch to Anna',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain("couldn't find");
    expect(result.details?.availableProviders).toEqual([]);
  });

  it('fails when service is missing in catalog', async () => {
    serviceRepo.findOne.mockResolvedValueOnce(null);
    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      {
        slug: 'salon',
        serviceId: 'svc-missing',
        date: '2026-07-01',
        timeSlot,
      },
      'Keep 3pm but different stylist',
    );
    expect(result.summary).toContain('Service not found');
  });

  it('succeeds when an alternate provider is available', async () => {
    publicBookingService.getServiceDaySlots.mockResolvedValueOnce({
      date: '2026-07-01',
      serviceId: 'svc-haircut',
      serviceName: 'Haircut',
      slots: [
        {
          startTime,
          endTime: '2026-07-01T16:00:00.000Z',
          employeeId: 'emp-marco',
          employeeName: 'Marco',
        },
        {
          startTime,
          endTime: '2026-07-01T16:00:00.000Z',
          employeeId: 'emp-anna',
          employeeName: 'Anna',
        },
      ],
    });

    const result = await handleSwitchProviderSameTimeLogic(
      switchDeps(),
      'biz-1',
      {
        slug: 'salon',
        serviceId: 'svc-haircut',
        date: '2026-07-01',
        employeeId: 'emp-marco',
        timeSlot,
      },
      'Keep 3pm but different stylist',
    );

    expect(result.success).toBe(true);
    expect(result.details?.employeeId).toBe('emp-anna');
  });
});
