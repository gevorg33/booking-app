import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { CatalogLogicDeps } from './ai-catalog.logic.js';
import {
  parseUpdateServiceDurationBufferFromPrompt,
  resolveTargetServicesForDurationBuffer,
} from './ai-service-duration-buffer.util.js';

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

function describeScope(config: {
  allServices?: boolean;
  serviceName?: string;
  serviceNames?: string[];
  categoryName?: string;
}): string {
  if (config.allServices) return 'all services';
  if (config.serviceNames?.length) {
    return config.serviceNames.join(' and ');
  }
  if (config.serviceName) return config.serviceName;
  if (config.categoryName) return `${config.categoryName} services`;
  return 'selected services';
}

function describeTiming(config: {
  durationMinutes?: number;
  bufferMinutes?: number;
}): string {
  const parts: string[] = [];
  if (config.durationMinutes !== undefined) {
    parts.push(`${config.durationMinutes} min duration`);
  }
  if (config.bufferMinutes !== undefined) {
    parts.push(`${config.bufferMinutes} min buffer`);
  }
  return parts.join(' and ');
}

export async function handleUpdateServiceDurationBufferLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  services: Service[],
  prompt?: string,
  userId?: string,
): Promise<CommandResult> {
  const parsed = parseUpdateServiceDurationBufferFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'update_service_duration_buffer',
      'Specify duration and/or buffer with scope (e.g. "Set all massage services to 60 minutes with 15 min buffer").',
      {
        clarify: true,
        missing: [
          'durationMinutes',
          'bufferMinutes',
          'serviceName',
          'categoryName',
        ],
      },
    );
  }

  if (
    parsed.durationMinutes === undefined &&
    parsed.bufferMinutes === undefined
  ) {
    return failure(
      'update_service_duration_buffer',
      'Specify duration minutes and/or buffer minutes to update.',
      { clarify: true, missing: ['durationMinutes', 'bufferMinutes'] },
    );
  }

  if (
    !parsed.allServices &&
    !parsed.serviceName &&
    !parsed.serviceNames?.length &&
    !parsed.categoryName
  ) {
    return failure(
      'update_service_duration_buffer',
      'Specify which services to update: all services, a category, service names, or one service.',
      {
        clarify: true,
        missing: ['serviceName', 'categoryName', 'allServices'],
      },
    );
  }

  const targets = resolveTargetServicesForDurationBuffer(services, parsed);
  if (!targets.length) {
    return failure(
      'update_service_duration_buffer',
      'No matching active services found for that scope.',
      { clarify: true },
    );
  }

  const patch: { durationMinutes?: number; bufferMinutes?: number } = {};
  if (parsed.durationMinutes !== undefined) {
    patch.durationMinutes = parsed.durationMinutes;
  }
  if (parsed.bufferMinutes !== undefined) {
    patch.bufferMinutes = parsed.bufferMinutes;
  }

  const updatedServices: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    bufferMinutes: number;
  }> = [];

  for (const service of targets) {
    const updated = await deps.serviceService.update(service.id, patch, userId);
    updatedServices.push({
      id: updated.id,
      name: updated.name,
      durationMinutes: updated.durationMinutes,
      bufferMinutes: updated.bufferMinutes ?? 0,
    });
  }

  const scopeLabel = describeScope(parsed);
  const timingLabel = describeTiming(parsed);

  return success(
    'update_service_duration_buffer',
    `Updated ${updatedServices.length} service(s) for ${scopeLabel}: ${timingLabel}.`,
    {
      updatedCount: updatedServices.length,
      services: updatedServices,
      durationMinutes: parsed.durationMinutes,
      bufferMinutes: parsed.bufferMinutes,
      navigate: { path: '/dashboard/services', label: 'Open Services' },
    },
  );
}
