import { PrepaymentMode } from '../service/entities/service.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import {
  createEmptyBookingPopularityRepoMock,
  createPublicBookingServiceHarness,
} from './public-booking-test.harness.js';

describe('e2e-bug.315 createBooking gates assigned-provider hour roll-forward', () => {
  function createHarness(allowRollForward: boolean | undefined) {
    const business = {
      id: 'biz-1',
      name: 'Studio',
      slug: 'studio',
      timezone: 'UTC',
      isActive: true,
      settings: {
        locale: 'en',
        publicBooking: {
          enabled: true,
          ...(allowRollForward === undefined
            ? {}
            : { allowAssignedProviderHourRollForward: allowRollForward }),
        },
      },
    } as unknown as Business;

    const service = {
      id: 'svc-face',
      businessId: 'biz-1',
      name: 'Face Pilling',
      isActive: true,
      prepaymentMode: PrepaymentMode.NONE,
      price: 80,
      durationMinutes: 60,
      bufferMinutes: 0,
      currency: 'USD',
      metadata: {},
    };

    const employee = {
      id: 'emp-karo',
      name: 'Karo',
      isActive: true,
      serviceIds: ['svc-face'],
    };

    const businessService = {
      findBySlug: jest.fn().mockResolvedValue(business),
      findOne: jest.fn().mockResolvedValue(business),
    };
    const serviceRepo = {
      findOne: jest.fn().mockResolvedValue(service),
      find: jest.fn().mockResolvedValue([service]),
    };
    const employeeRepo = {
      find: jest.fn().mockResolvedValue([employee]),
    };

    const serviceInstance = createPublicBookingServiceHarness({
      businessService,
      serviceRepo,
      employeeRepo,
      bookingRepo: createEmptyBookingPopularityRepoMock(),
    });
    (serviceInstance as any).serviceRepo = serviceRepo;
    (serviceInstance as any).employeeRepo = employeeRepo;

    const materializeSpy = jest
      .spyOn(serviceInstance as any, 'materializeAssignedProvidersUpcomingHours')
      .mockResolvedValue(undefined);

    return { service: serviceInstance, materializeSpy };
  }

  async function attemptCreateBooking(service: any) {
    try {
      await service.createBooking('studio', {
        serviceId: 'svc-face',
        startTime: '2026-08-05T09:00:00.000Z',
        customer: { name: 'Jane', email: 'jane@example.com' },
      });
    } catch {
      // Downstream pricing/payment steps aren't mocked in this harness —
      // only the materialize gate decision (made before those steps) matters.
    }
  }

  it('materializes real schedule rows when the flag is unset (default = allowed)', async () => {
    const { service, materializeSpy } = createHarness(undefined);
    await attemptCreateBooking(service);
    expect(materializeSpy).toHaveBeenCalledTimes(1);
  });

  it('materializes real schedule rows when the flag is explicitly true', async () => {
    const { service, materializeSpy } = createHarness(true);
    await attemptCreateBooking(service);
    expect(materializeSpy).toHaveBeenCalledTimes(1);
  });

  it('skips materialize entirely when the business has opted out (flag = false)', async () => {
    const { service, materializeSpy } = createHarness(false);
    await attemptCreateBooking(service);
    expect(materializeSpy).not.toHaveBeenCalled();
  });
});
