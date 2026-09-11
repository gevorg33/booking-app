import type { CommandResult } from './command-completion.types.js';
import type { AiClinicServiceService } from './ai-clinic-service.service.js';
import {
  parseConfigureClinicServiceFromPrompt,
  parseExplainClinicServicesFromPrompt,
} from './ai-clinic-service.util.js';

export type ClinicServiceDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt: string;
  userId?: string;
};

export type ClinicServiceDispatchHandler = (
  service: AiClinicServiceService,
  ctx: ClinicServiceDispatchContext,
) => Promise<CommandResult>;

export function buildClinicServiceDispatchMap(): ReadonlyMap<
  string,
  ClinicServiceDispatchHandler
> {
  const map = new Map<string, ClinicServiceDispatchHandler>();

  map.set('configure_clinic_service', async (service, ctx) => {
    const parsed = parseConfigureClinicServiceFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    const merged = parsed
      ? {
          ...ctx.params,
          serviceId: parsed.serviceId,
          serviceName: parsed.serviceName,
          ...(parsed.serviceType ? { serviceType: parsed.serviceType } : {}),
          ...(parsed.requiresFasting !== undefined
            ? { requiresFasting: parsed.requiresFasting }
            : {}),
          ...(parsed.preparationNotes
            ? { preparationNotes: parsed.preparationNotes }
            : {}),
        }
      : ctx.params;
    return service.handleConfigureClinicService(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('explain_clinic_services', async (service, ctx) => {
    const parsed = parseExplainClinicServicesFromPrompt(ctx.prompt, ctx.params);
    const merged = parsed
      ? {
          ...ctx.params,
          serviceId: parsed.serviceId,
          serviceName: parsed.serviceName,
        }
      : ctx.params;
    return service.handleExplainClinicServices(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('apply_clinic_playbook', async (service, ctx) =>
    service.handleApplyClinicPlaybook(
      ctx.businessId,
      ctx.userId,
      ctx.params,
      ctx.prompt,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiClinicServiceService (ai-cmd-ext-0.5). */
export const CLINIC_SERVICE_DISPATCH_MAP = buildClinicServiceDispatchMap();
