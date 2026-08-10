import type { Repository } from 'typeorm';
import type { ProductRecommendationService } from '../inventory/product-recommendation.service.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { Booking } from '../booking/entities/booking.entity.js';
import type { PublicRecommendationProduct } from '../../common/utils/product-recommendation.util.js';
import { resolveProductRecommendationSettings } from '../../common/utils/product-recommendation-settings.util.js';
import {
  formatDateDisplay,
  formatTimeRangeDisplay,
} from '../../common/utils/date-format.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseExplainConsumerCheckoutSuccessFromPrompt,
  type ConsumerCheckoutSuccessAspect,
  type ParsedExplainConsumerCheckoutSuccess,
} from './ai-consumer-checkout-success.util.js';
import { matchServiceByNameLegacy } from './ai-legacy-service-match.util.js';

export interface ExplainConsumerCheckoutSuccessLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  serviceRepo: Pick<Repository<Service>, 'findOne' | 'find'>;
  bookingRepo: Pick<Repository<Booking>, 'findOne'>;
  productRecommendationService: Pick<
    ProductRecommendationService,
    'getCheckoutRecommendations'
  >;
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function buildSummaryAspectText(input: {
  serviceName: string | null;
  bookingStart?: Date;
  bookingEnd?: Date;
  locale?: string;
}): string {
  const serviceLabel = input.serviceName
    ? `your "${input.serviceName}" booking`
    : 'your booking';
  const timeLine =
    input.bookingStart && input.bookingEnd
      ? ` The confirmed time is ${formatDateDisplay(input.bookingStart, input.locale)} ${formatTimeRangeDisplay(input.bookingStart, input.bookingEnd, input.locale)}.`
      : '';

  return `After checkout in the consumer app, the success screen shows a green checkmark with "Booking confirmed!" for ${serviceLabel}, followed by the booked date and time range.${timeLine} A short hint explains you can manage the appointment from your account. If you paid online, a subtotal and total due breakdown may appear below the confirmation message.`;
}

function buildActionsAspectText(): string {
  return `On the consumer app success screen, "View appointments" opens your account page where upcoming and past bookings are listed. "Book another service" returns you to the salon service catalog so you can start a new booking without leaving the app.`;
}

function buildDismissAspectText(): string {
  return `The "Dismiss recommendations" control (X icon beside "You might also like") on the consumer app success screen hides the product section for this visit. Your confirmed booking summary and the "View appointments" / "Book another service" buttons stay on screen. Dismissing does not cancel the appointment or remove it from your account — it only collapses the optional retail suggestions.`;
}

function buildRecommendationsAspectText(input: {
  serviceName: string | null;
  products: PublicRecommendationProduct[];
  maxProductCount: number;
  recommendationsVisible: boolean;
}): string {
  const serviceLabel = input.serviceName
    ? `after ${input.serviceName}`
    : 'after your booking';

  if (!input.recommendationsVisible) {
    return `The "You might also like" section on the consumer app success screen ${serviceLabel} stays hidden while recommendations load, when the salon has no linked active products for that service or category, when the API returns an error, or after you dismiss the section. Ask about specific product cards separately if products do appear.`;
  }

  const visibleCount = Math.min(input.products.length, input.maxProductCount);
  return `On the consumer app success screen ${serviceLabel}, the "You might also like" section appears once recommendations finish loading and at least one product is linked to the booked service (or its category as fallback). Up to ${input.maxProductCount} card(s) can show; you currently have ${visibleCount} eligible product(s). The section sits above the "View appointments" and "Book another service" buttons until you dismiss it. For which products appear or why they were chosen, ask about the recommendation cards directly.`;
}

function buildAllAspectText(input: {
  serviceName: string | null;
  bookingStart?: Date;
  bookingEnd?: Date;
  locale?: string;
  products: PublicRecommendationProduct[];
  maxProductCount: number;
  recommendationsVisible: boolean;
}): string {
  return `${buildSummaryAspectText(input)} ${buildActionsAspectText()} ${buildRecommendationsAspectText(input)}`;
}

function buildAspectSummary(
  aspect: ConsumerCheckoutSuccessAspect,
  input: {
    serviceName: string | null;
    bookingStart?: Date;
    bookingEnd?: Date;
    locale?: string;
    products: PublicRecommendationProduct[];
    maxProductCount: number;
    recommendationsVisible: boolean;
  },
): string {
  if (aspect === 'summary') return buildSummaryAspectText(input);
  if (aspect === 'actions') return buildActionsAspectText();
  if (aspect === 'dismiss') return buildDismissAspectText();
  if (aspect === 'recommendations') {
    return buildRecommendationsAspectText(input);
  }
  return buildAllAspectText(input);
}

async function resolveBookedService(
  deps: ExplainConsumerCheckoutSuccessLogicDeps,
  businessId: string,
  parsed: ParsedExplainConsumerCheckoutSuccess,
): Promise<{
  service: Service | null;
  booking: Booking | null;
}> {
  if (parsed.bookingId) {
    const booking = await deps.bookingRepo.findOne({
      where: { id: parsed.bookingId, businessId },
    });
    if (booking?.serviceId) {
      const service = await deps.serviceRepo.findOne({
        where: { id: booking.serviceId, businessId, isActive: true },
        relations: { category: true },
      });
      return { service: service ?? null, booking: booking ?? null };
    }
    return { service: null, booking: booking ?? null };
  }

  if (parsed.serviceId) {
    const service = await deps.serviceRepo.findOne({
      where: { id: parsed.serviceId, businessId, isActive: true },
      relations: { category: true },
    });
    return { service: service ?? null, booking: null };
  }

  if (parsed.serviceName) {
    const service = await deps.serviceRepo
      .find({
        where: { businessId, isActive: true },
        relations: { category: true },
      })
      .then((list) => matchServiceByNameLegacy(list, parsed.serviceName!));
    return { service: service ?? null, booking: null };
  }

  return { service: null, booking: null };
}

export async function handleExplainConsumerCheckoutSuccessLogic(
  deps: ExplainConsumerCheckoutSuccessLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainConsumerCheckoutSuccessFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_consumer_checkout_success',
      'Ask about the consumer app booking success screen (e.g. "What is shown after I confirm in the app?" or "When do product cards appear on success?").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_consumer_checkout_success', 'Business not found.');
  }

  const { service, booking } = await resolveBookedService(
    deps,
    businessId,
    parsed,
  );

  const locale =
    typeof params.locale === 'string' ? params.locale.trim() : undefined;

  const { maxProductCount } = resolveProductRecommendationSettings(
    business.settings as Record<string, unknown> | undefined,
  );

  let products: PublicRecommendationProduct[] = [];
  if (service) {
    const serviceProducts =
      await deps.productRecommendationService.getCheckoutRecommendations(
        business,
        service.id,
        undefined,
      );
    const categoryProducts =
      serviceProducts.length === 0 && service.categoryId
        ? await deps.productRecommendationService.getCheckoutRecommendations(
            business,
            undefined,
            service.categoryId,
          )
        : [];
    products = serviceProducts.length > 0 ? serviceProducts : categoryProducts;
  }

  const recommendationsVisible = products.length > 0;
  const summary = buildAspectSummary(parsed.aspect, {
    serviceName: service?.name ?? null,
    bookingStart: booking?.startTime,
    bookingEnd: booking?.endTime,
    locale,
    products,
    maxProductCount,
    recommendationsVisible,
  });

  return success('explain_consumer_checkout_success', summary, {
    aspect: parsed.aspect,
    serviceId: service?.id,
    serviceName: service?.name,
    bookingId: booking?.id ?? parsed.bookingId,
    maxProductCount,
    productCount: products.length,
    recommendationsVisible,
    surface: 'consumer_app_checkout_success',
  });
}
