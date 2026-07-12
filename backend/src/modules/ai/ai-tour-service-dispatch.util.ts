import type { CommandResult } from './command-completion.types.js';
import type { AiTourServiceService } from './ai-tour-service.service.js';
import {
  TOUR_SERVICE_DISPATCH_MAP,
  type TourServiceDispatchContext,
  type TourServiceDispatchHandler,
} from './ai-tour-service-dispatch.build.js';

export function getTourServiceDispatchHandler(
  action: string,
): TourServiceDispatchHandler | undefined {
  return TOUR_SERVICE_DISPATCH_MAP.get(action);
}

export async function dispatchTourServiceIntent(
  service: AiTourServiceService,
  ctx: TourServiceDispatchContext,
): Promise<CommandResult | null> {
  const handler = TOUR_SERVICE_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function tourServiceDispatchMapHas(action: string): boolean {
  return TOUR_SERVICE_DISPATCH_MAP.has(action);
}
