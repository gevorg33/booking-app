import type { CommandResult } from './command-completion.types.js';
import {
  EXTERNAL_DOCTORS_LOGIC_DISPATCH_MAP,
  type ExternalDoctorsDispatchContext,
  type ExternalDoctorsLogicDispatchHandler,
} from './ai-external-doctors-dispatch.build.js';
import type { ExternalDoctorsLogicDeps } from './ai-external-doctors.logic.js';

export function getExternalDoctorsLogicDispatchHandler(
  action: string,
): ExternalDoctorsLogicDispatchHandler | undefined {
  return EXTERNAL_DOCTORS_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchExternalDoctorsLogicIntent(
  deps: ExternalDoctorsLogicDeps,
  ctx: ExternalDoctorsDispatchContext,
): Promise<CommandResult | null> {
  const handler = EXTERNAL_DOCTORS_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function externalDoctorsDispatchMapHas(action: string): boolean {
  return EXTERNAL_DOCTORS_LOGIC_DISPATCH_MAP.has(action);
}
