import type { Repository } from 'typeorm';
import type { ProductRecommendationService } from '../inventory/product-recommendation.service.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { Booking } from '../booking/entities/booking.entity.js';
import type { PublicRecommendationProduct } from '../../common/utils/product-recommendation.util.js';
import { resolveProductRecommendationSettings } from '../../common/utils/product-recommendation-settings.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  parseExplainCheckoutRecommendationsFromPrompt,
  type CheckoutRecommendationsAspect,
  type ParsedExplainCheckoutRecommendations,
} from './ai-checkout-recommendations.util.js';
import { matchServiceByNameLegacy } from './ai-legacy-service-match.util.js';

export interface ExplainCheckoutRecommendationsLogicDeps {
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

function formatProductList(products: PublicRecommendationProduct[]): string {
  if (products.length === 0) return 'no product cards';
  return products
    .map((product) => {
      const parts = [product.name];
      if (product.price !== undefined) parts.push(`price ${product.price}`);
      if (product.externalLink) parts.push('shop link');
      return parts.join(' — ');
    })
    .join('; ');
}

function buildAspectSummary(
  aspect: CheckoutRecommendationsAspect,
  input: {
    serviceName: string | null;
    maxProductCount: number;
    products: PublicRecommendationProduct[];
    source: 'service' | 'category' | 'none';
  },
): string {
  const serviceLabel = input.serviceName
    ? `your "${input.serviceName}" booking`
    : 'your booking';
  const productList = formatProductList(input.products);

  if (aspect === 'shopLink') {
    const withLink = input.products.filter((product) => product.externalLink);
    if (withLink.length === 0) {
      return `The "You might also like" cards after ${serviceLabel} do not include external shop links right now.`;
    }
    return `Shop links on the success-screen cards (${withLink.map((p) => p.name).join(', ')}) open the salon's external product page in your browser — they are optional add-ons, not part of your appointment charge.`;
  }

  if (aspect === 'maxCount') {
    return `Up to ${input.maxProductCount} product card(s) can appear in "You might also like" after ${serviceLabel}.`;
  }

  if (aspect === 'whyShown') {
    if (input.products.length === 0) {
      return `No "You might also like" cards appear after ${serviceLabel} when the salon has not linked active products to that service or its category.`;
    }
    const sourceText =
      input.source === 'service'
        ? `products linked to the booked service`
        : input.source === 'category'
          ? `products linked to the service category`
          : `salon recommendation rules`;
    return `After ${serviceLabel}, the success screen shows ${productList} because the salon configured ${sourceText} for post-checkout recommendations (service links take priority over category fallback).`;
  }

  if (aspect === 'products') {
    if (input.products.length === 0) {
      return `No "You might also like" product cards are configured for ${serviceLabel} on the confirmation screen.`;
    }
    return `On the booking success screen after ${serviceLabel}, you should see: ${productList}.`;
  }

  const sourceText =
    input.source === 'service'
      ? 'service-linked products'
      : input.source === 'category'
        ? 'category-linked products'
        : 'no linked products';
  return `"You might also like" after ${serviceLabel} shows up to ${input.maxProductCount} card(s) from ${sourceText}. Currently: ${productList}. External shop links are optional purchases outside the booking.`;
}

async function resolveBookedService(
  deps: ExplainCheckoutRecommendationsLogicDeps,
  businessId: string,
  parsed: ParsedExplainCheckoutRecommendations,
): Promise<{ service: Service | null; bookingId?: string }> {
  if (parsed.serviceId) {
    const service = await deps.serviceRepo.findOne({
      where: { id: parsed.serviceId, businessId, isActive: true },
      relations: { category: true },
    });
    return { service, bookingId: parsed.bookingId };
  }

  if (parsed.bookingId) {
    const booking = await deps.bookingRepo.findOne({
      where: { id: parsed.bookingId, businessId },
    });
    if (booking?.serviceId) {
      const service = await deps.serviceRepo.findOne({
        where: { id: booking.serviceId, businessId, isActive: true },
        relations: { category: true },
      });
      return { service: service ?? null, bookingId: booking.id };
    }
  }

  if (parsed.serviceName) {
    const service = await deps.serviceRepo
      .find({
        where: { businessId, isActive: true },
        relations: { category: true },
      })
      .then((list) => matchServiceByNameLegacy(list, parsed.serviceName!));
    return { service: service ?? null, bookingId: parsed.bookingId };
  }

  return { service: null, bookingId: parsed.bookingId };
}

export async function handleExplainCheckoutRecommendationsLogic(
  deps: ExplainCheckoutRecommendationsLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainCheckoutRecommendationsFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_checkout_recommendations',
      'Ask about "You might also like" product cards on the booking success screen (e.g. "What are these recommended products after I booked?").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_checkout_recommendations', 'Business not found.');
  }

  const { service, bookingId } = await resolveBookedService(
    deps,
    businessId,
    parsed,
  );
  if (!service) {
    return failure(
      'explain_checkout_recommendations',
      parsed.serviceName || parsed.serviceId || parsed.bookingId
        ? 'Could not resolve the booked service for these recommendation cards — complete a booking first or name the service from your confirmation screen.'
        : 'Complete a booking first so we know which service\'s "You might also like" cards to explain.',
      {
        clarify: true,
        missing: ['serviceId', 'bookingId'],
      },
    );
  }

  const { maxProductCount } = resolveProductRecommendationSettings(
    business.settings as Record<string, unknown> | undefined,
  );

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

  const products =
    serviceProducts.length > 0 ? serviceProducts : categoryProducts;
  const source: 'service' | 'category' | 'none' =
    serviceProducts.length > 0
      ? 'service'
      : categoryProducts.length > 0
        ? 'category'
        : 'none';

  const summary = buildAspectSummary(parsed.aspect, {
    serviceName: service.name,
    maxProductCount,
    products,
    source,
  });

  return success('explain_checkout_recommendations', summary, {
    aspect: parsed.aspect,
    serviceId: service.id,
    serviceName: service.name,
    bookingId,
    maxProductCount,
    source,
    products,
    productCount: products.length,
    surface: 'checkout_success',
  });
}
