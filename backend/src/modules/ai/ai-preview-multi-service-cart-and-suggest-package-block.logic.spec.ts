import {
  handlePreviewMultiServiceCartLogic,
  handleSuggestPackageBlockLogic,
  type SelfServiceBookingLogicDeps,
} from './ai-self-service-booking.logic.js';

function buildDeps(
  overrides: Partial<SelfServiceBookingLogicDeps> = {},
): SelfServiceBookingLogicDeps {
  const business = { id: 'biz-1', slug: 'salon' };
  const services = [
    {
      id: 'svc-1',
      name: 'Massage',
      durationMinutes: 60,
      bufferMinutes: 0,
      price: 80,
      isActive: true,
    },
    {
      id: 'svc-2',
      name: 'Facial',
      durationMinutes: 45,
      bufferMinutes: 0,
      price: 60,
      isActive: true,
    },
  ];

  return {
    publicBookingService: {
      previewMultiServiceSelection: jest.fn(async () => ({
        valid: true,
        errors: [],
        services: [
          { serviceId: 'svc-1', name: 'Massage', durationMinutes: 60, price: 80 },
          { serviceId: 'svc-2', name: 'Facial', durationMinutes: 45, price: 60 },
        ],
        totals: {
          blockDurationMinutes: 110,
          totalPrice: 140,
          currency: 'USD',
        },
      })),
      suggestPackageBlock: jest.fn(async () => ({
        startTime: '2026-06-10T10:00:00.000Z',
        dateKey: '2026-06-10',
        employeeId: 'emp-1',
        employeeName: 'Maria',
      })),
    } as any,
    publicCustomerBookingService: {} as any,
    publicCustomerAuthService: {} as any,
    packagesService: {
      listPublicPackages: jest.fn(async () => [
        { id: 'pkg-1', name: 'Spa Day' },
      ]),
    } as any,
    subscriptionsService: {} as any,
    multiServiceBookingsService: {} as any,
    bookingRepo: {} as any,
    businessRepo: {
      findOne: jest.fn(async () => business),
    } as any,
    serviceRepo: {
      find: jest.fn(async () => services),
    } as any,
    configService: {} as any,
    ...overrides,
  };
}

describe('ai-self-service-booking.logic — preview_multi_service_cart / suggest_package_block', () => {
  let deps: SelfServiceBookingLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('previews the multi-service cart totals for named services', async () => {
    const result = await handlePreviewMultiServiceCartLogic(deps, 'biz-1', {
      serviceNames: ['Massage', 'Facial'],
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('preview_multi_service_cart');
    expect(result.summary).toContain('110 minutes');
    expect(result.summary).toContain('140');
    expect(result.details?.serviceIds).toEqual(['svc-1', 'svc-2']);
    expect(deps.publicBookingService.previewMultiServiceSelection).toHaveBeenCalledWith(
      'salon',
      ['svc-1', 'svc-2'],
    );
  });

  it('resolves cart service ids from session params', async () => {
    const result = await handlePreviewMultiServiceCartLogic(deps, 'biz-1', {
      cartServiceIds: 'svc-1,svc-2',
    });

    expect(result.success).toBe(true);
    expect(result.details?.serviceIds).toEqual(['svc-1', 'svc-2']);
  });

  it('clarifies when no services are named or in cart', async () => {
    const result = await handlePreviewMultiServiceCartLogic(deps, 'biz-1', {});

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toEqual(['serviceNames']);
  });

  it('fails gracefully when business is not found', async () => {
    (deps.businessRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
    const result = await handlePreviewMultiServiceCartLogic(deps, 'missing', {
      serviceNames: ['Massage'],
    });

    expect(result.success).toBe(false);
    expect(result.summary).toBe('Business not found.');
  });

  it('reports invalid selection errors from the preview call', async () => {
    (
      deps.publicBookingService.previewMultiServiceSelection as jest.Mock
    ).mockRejectedValueOnce(new Error('Services must share a provider'));

    const result = await handlePreviewMultiServiceCartLogic(deps, 'biz-1', {
      serviceNames: ['Massage', 'Facial'],
    });

    expect(result.success).toBe(false);
    expect(result.summary).toBe('Services must share a provider');
    expect(result.details?.reason).toBe('invalid_selection');
  });

  it('suggests the earliest package block by name', async () => {
    const result = await handleSuggestPackageBlockLogic(deps, 'biz-1', {
      packageName: 'Spa Day',
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('suggest_package_block');
    expect(result.summary).toContain('Maria');
    expect(result.details?.packageId).toBe('pkg-1');
    expect(result.details?.navigate).toEqual({
      path: 'checkout',
      query: { packageId: 'pkg-1', startTime: '2026-06-10T10:00:00.000Z' },
    });
  });

  it('clarifies when no package is named', async () => {
    const result = await handleSuggestPackageBlockLogic(deps, 'biz-1', {});

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toEqual(['packageName']);
  });

  it('fails gracefully when no block is available', async () => {
    (deps.publicBookingService.suggestPackageBlock as jest.Mock).mockRejectedValueOnce(
      new Error('No availability'),
    );

    const result = await handleSuggestPackageBlockLogic(deps, 'biz-1', {
      packageName: 'Spa Day',
    });

    expect(result.success).toBe(false);
    expect(result.summary).toBe('No availability');
    expect(result.details?.reason).toBe('no_blocks');
  });
});
