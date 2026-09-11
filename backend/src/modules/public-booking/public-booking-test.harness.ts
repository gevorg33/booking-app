import { ConfigService } from '@nestjs/config';
import { PublicBookingService } from './public-booking.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';

/** Partial mock placeholder — specs only wire deps they exercise. */
const EMPTY = {} as any;

/** Empty 90-day popularity query — specs that call getServices need bookingRepo.createQueryBuilder. */
export function createEmptyBookingPopularityRepoMock() {
  return {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };
}

/**
 * A repository that exists but holds nothing.
 *
 * The default for repo slots was a bare `{}`, so the first call to any method
 * threw `this.<repo>.find is not a function` — which reads like a broken mock
 * but actually means the code under test started traversing a path this spec
 * never declared a repo for. "No rows" is the honest answer for a table the
 * spec did not seed, and it fails on the assertion instead of on the stub.
 *
 * Deliberately only for **repositories**: their interface is uniform and an
 * empty result is meaningful. Service slots keep the bare `{}` default, so a
 * spec that starts depending on a new service still fails loudly rather than
 * silently receiving a no-op.
 */
export function createEmptyRepoMock() {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findBy: jest.fn().mockResolvedValue([]),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue(undefined),
      getCount: jest.fn().mockResolvedValue(0),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };
}

export { createBookingManagerMock } from '../../common/utils/booking-manager.mock.js';

export type PublicBookingHarnessDeps = {
  businessService?: unknown;
  bookingService?: unknown;
  customerService?: unknown;
  schedulingEngine?: unknown;
  stripeIntegrationService?: StripeIntegrationService;
  reviewsService?: unknown;
  bookingPaymentService?: unknown;
  checkoutPricingService?: unknown;
  promoCodesService?: unknown;
  loyaltyService?: unknown;
  planEntitlementsService?: unknown;
  subscriptionsService?: unknown;
  packagesService?: unknown;
  multiServiceBookingsService?: unknown;
  notificationsService?: unknown;
  productRecommendationService?: unknown;
  configService?: ConfigService;
  referralProgramService?: unknown;
  shareRewardService?: unknown;
  tenantAppInstallService?: unknown;
  employeeRepo?: unknown;
  serviceRepo?: unknown;
  slotRepo?: unknown;
  schedulingPeriodRepo?: unknown;
  bookingRepo?: unknown;
  scheduleTemplateRepo?: unknown;
  publicPreVisitIntakeService?: unknown;
  clinicTestOrderBookingRequestService?: unknown;
};

/** Constructs PublicBookingService with correct ctor arg order for unit/integration specs. */
export function createPublicBookingServiceHarness(
  deps: PublicBookingHarnessDeps = {},
): PublicBookingService {
  const stripe =
    deps.stripeIntegrationService ??
    ({
      isConnectReady: jest.fn().mockReturnValue(false),
    } as unknown as StripeIntegrationService);
  const config =
    deps.configService ??
    ({
      get: jest.fn((key: string) =>
        key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
      ),
    } as unknown as ConfigService);

  return new PublicBookingService(
    deps.businessService ?? EMPTY,
    deps.bookingService ?? EMPTY,
    deps.customerService ?? EMPTY,
    deps.schedulingEngine ?? EMPTY,
    stripe,
    deps.reviewsService ?? EMPTY,
    deps.bookingPaymentService ?? EMPTY,
    deps.checkoutPricingService ?? EMPTY,
    deps.promoCodesService ?? EMPTY,
    deps.loyaltyService ?? EMPTY,
    deps.planEntitlementsService ?? EMPTY,
    deps.subscriptionsService ?? EMPTY,
    deps.packagesService ?? EMPTY,
    deps.multiServiceBookingsService ?? EMPTY,
    deps.notificationsService ?? EMPTY,
    deps.productRecommendationService ?? EMPTY,
    config,
    deps.referralProgramService ?? EMPTY,
    deps.shareRewardService ?? EMPTY,
    deps.tenantAppInstallService ?? EMPTY,
    (deps.employeeRepo ?? createEmptyRepoMock()) as never,
    (deps.serviceRepo ?? createEmptyRepoMock()) as never,
    (deps.slotRepo ?? createEmptyRepoMock()) as never,
    (deps.schedulingPeriodRepo ?? createEmptyRepoMock()) as never,
    (deps.bookingRepo ?? createEmptyBookingPopularityRepoMock()) as any,
    deps.scheduleTemplateRepo as never,
    deps.publicPreVisitIntakeService as never,
    deps.clinicTestOrderBookingRequestService as never,
  );
}
