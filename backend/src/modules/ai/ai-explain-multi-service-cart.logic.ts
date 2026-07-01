import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import { parseCartServiceIds } from './ai-self-service-booking.util.js';
import {
  buildExplainMultiServiceCartSummary,
  computeMultiServiceCartTotalMinutes,
  inferExplainMultiServiceCartFocus,
  isExplainMultiServiceCartPrompt,
  type MultiServiceCartLine,
} from './ai-explain-multi-service-cart.util.js';

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

export async function handleExplainMultiServiceCartLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  if (!isExplainMultiServiceCartPrompt(textPrompt)) {
    return failure(
      'explain_multi_service_cart',
      'Ask what is in your cart or how long your multi-service visit will take.',
      { clarify: true },
    );
  }

  const serviceIds = parseCartServiceIds(params.cartServiceIds);
  if (!serviceIds.length) {
    return failure(
      'explain_multi_service_cart',
      'Your cart is empty — add services first.',
      {
        totalMinutes: 0,
        serviceCount: 0,
        services: [],
        cartServiceIds: [],
      },
    );
  }

  const catalog = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });
  const selected = serviceIds
    .map((id) => catalog.find((service) => service.id === id))
    .filter((service): service is Service => Boolean(service));

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  const turnoverBufferMinutes = business
    ? deps.multiServiceBookingsService.resolveSettingsFromBusiness(business)
        .turnoverBufferMinutes
    : 5;

  const lines: MultiServiceCartLine[] = selected.map((service) => ({
    id: service.id,
    name: service.name,
    durationMinutes: service.durationMinutes,
    bufferMinutes: service.bufferMinutes,
    price: service.price,
  }));

  const totalMinutes = computeMultiServiceCartTotalMinutes(
    lines,
    turnoverBufferMinutes,
  );
  const focus = inferExplainMultiServiceCartFocus(textPrompt);
  const summary = buildExplainMultiServiceCartSummary({
    lines,
    totalMinutes,
    turnoverBufferMinutes,
    focus,
  });

  return success('explain_multi_service_cart', summary, {
    focus,
    totalMinutes,
    serviceCount: lines.length,
    turnoverBufferMinutes,
    services: lines,
    cartServiceIds: serviceIds,
  });
}
