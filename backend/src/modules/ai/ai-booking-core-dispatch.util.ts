import type { CommandResult } from './command-completion.types.js';
import type { AiBookingCoreService } from './ai-booking-core.service.js';
import {
  BOOKING_CORE_DISPATCH_MAP,
  type BookingCoreDispatchContext,
  type BookingCoreDispatchHandler,
} from './ai-booking-core-dispatch.build.js';

export function getBookingCoreDispatchHandler(
  action: string,
): BookingCoreDispatchHandler | undefined {
  return BOOKING_CORE_DISPATCH_MAP.get(action);
}

export async function dispatchBookingCoreIntent(
  service: AiBookingCoreService,
  ctx: BookingCoreDispatchContext,
): Promise<CommandResult | null> {
  const handler = BOOKING_CORE_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function bookingCoreDispatchMapHas(action: string): boolean {
  return BOOKING_CORE_DISPATCH_MAP.has(action);
}
