import type { CommandResult } from './command-completion.types.js';
import type { AiBookingDepthService } from './ai-booking-depth.service.js';
import {
  BOOKING_DEPTH_DISPATCH_MAP,
  type BookingDepthDispatchContext,
  type BookingDepthDispatchHandler,
} from './ai-booking-depth-dispatch.build.js';

export function getBookingDepthDispatchHandler(
  action: string,
): BookingDepthDispatchHandler | undefined {
  return BOOKING_DEPTH_DISPATCH_MAP.get(action);
}

export async function dispatchBookingDepthIntent(
  service: AiBookingDepthService,
  ctx: BookingDepthDispatchContext,
): Promise<CommandResult | null> {
  const handler = BOOKING_DEPTH_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function bookingDepthDispatchMapHas(action: string): boolean {
  return BOOKING_DEPTH_DISPATCH_MAP.has(action);
}
