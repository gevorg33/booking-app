import type { CommandResult } from './command-completion.types.js';
import type { AiSelfServiceBookingService } from './ai-self-service-booking.service.js';
import {
  SELF_SERVICE_BOOKING_DISPATCH_MAP,
  type SelfServiceBookingDispatchContext,
  type SelfServiceBookingDispatchHandler,
} from './ai-self-service-booking-dispatch.build.js';

export function getSelfServiceBookingDispatchHandler(
  action: string,
): SelfServiceBookingDispatchHandler | undefined {
  return SELF_SERVICE_BOOKING_DISPATCH_MAP.get(action);
}

export async function dispatchSelfServiceBookingIntent(
  service: AiSelfServiceBookingService,
  ctx: SelfServiceBookingDispatchContext,
): Promise<CommandResult | null> {
  const handler = SELF_SERVICE_BOOKING_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function selfServiceBookingDispatchMapHas(action: string): boolean {
  return SELF_SERVICE_BOOKING_DISPATCH_MAP.has(action);
}
