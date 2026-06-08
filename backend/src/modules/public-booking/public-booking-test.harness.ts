import { ConfigService } from '@nestjs/config';
import { PublicBookingService } from './public-booking.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';

/** Partial mock placeholder — specs only wire deps they exercise. */
const EMPTY = {} as any;

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
  employeeRepo?: unknown;
  serviceRepo?: unknown;
  slotRepo?: unknown;
  schedulingPeriodRepo?: unknown;
  bookingRepo?: unknown;
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
    deps.employeeRepo ?? EMPTY,
    deps.serviceRepo ?? EMPTY,
    deps.slotRepo ?? EMPTY,
    deps.schedulingPeriodRepo ?? EMPTY,
    deps.bookingRepo ?? EMPTY,
    deps.publicPreVisitIntakeService as never,
    deps.clinicTestOrderBookingRequestService as never,
  );
}
