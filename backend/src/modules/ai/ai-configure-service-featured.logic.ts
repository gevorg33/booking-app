import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { CatalogLogicDeps } from './ai-catalog.logic.js';
import {
  parseConfigureServiceFeaturedFromPrompt,
  resolveTargetServicesForFeaturedConfig,
  type ParsedConfigureServiceFeatured,
} from './ai-configure-service-featured.util.js';

const NAVIGATE = {
  path: '/dashboard/services',
  label: 'Open Services',
};

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

function hasMetadataChanges(parsed: ParsedConfigureServiceFeatured | null): boolean {
  if (!parsed) return false;
  return parsed.isFeatured != null || parsed.serviceTier != null;
}

function describeMetadataChanges(parsed: ParsedConfigureServiceFeatured): string {
  const parts: string[] = [];
  if (parsed.isFeatured === true) parts.push('featured');
  if (parsed.isFeatured === false) parts.push('not featured');
  if (parsed.serviceTier === 'premium') parts.push('premium tier');
  if (parsed.serviceTier === 'standard') parts.push('standard tier');
  if (parsed.serviceTier === '') parts.push('tier cleared');
  return parts.join(', ');
}

export async function handleConfigureServiceFeaturedLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  services: Service[],
  prompt?: string,
  userId?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseConfigureServiceFeaturedFromPrompt(
    effectivePrompt,
    params,
  );

  if (!parsed) {
    return failure(
      'configure_service_featured',
      'Ask to configure featured or tier metadata (e.g. "Mark Haircut as featured" or "Set Blowdry to premium tier").',
      {
        clarify: true,
        missing: ['isFeatured', 'serviceTier', 'serviceName'],
        navigate: NAVIGATE,
      },
    );
  }

  if (!hasMetadataChanges(parsed)) {
    return failure(
      'configure_service_featured',
      'What should I change — mark featured/unfeatured or set premium/standard tier?',
      {
        clarify: true,
        missing: ['isFeatured', 'serviceTier'],
        navigate: NAVIGATE,
      },
    );
  }

  const targets = resolveTargetServicesForFeaturedConfig(services, parsed);
  if (!targets.length) {
    return failure(
      'configure_service_featured',
      'Which service should I update? Name the service or category (e.g. "Mark Haircut as featured").',
      {
        clarify: true,
        missing: ['serviceName', 'serviceNames', 'categoryName'],
        navigate: NAVIGATE,
      },
    );
  }

  const updateDto: {
    isFeatured?: boolean;
    serviceTier?: 'standard' | 'premium' | '';
  } = {};
  if (parsed.isFeatured != null) updateDto.isFeatured = parsed.isFeatured;
  if (parsed.serviceTier != null) updateDto.serviceTier = parsed.serviceTier;

  const updatedServices: Array<{ id: string; name: string }> = [];
  for (const service of targets) {
    const updated = await deps.serviceService.update(
      service.id,
      updateDto,
      userId,
    );
    updatedServices.push({ id: updated.id, name: updated.name });
  }

  const changeLabel = describeMetadataChanges(parsed);
  const names = updatedServices.map((service) => `"${service.name}"`).join(', ');
  const summary =
    updatedServices.length === 1
      ? `Updated ${names} — ${changeLabel}.`
      : `Updated ${updatedServices.length} services (${names}) — ${changeLabel}.`;

  return success('configure_service_featured', summary, {
    services: updatedServices,
    isFeatured: parsed.isFeatured ?? null,
    serviceTier: parsed.serviceTier ?? null,
    navigate: NAVIGATE,
  });
}
