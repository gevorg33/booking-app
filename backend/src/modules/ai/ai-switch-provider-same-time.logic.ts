import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { PublicBookingService } from '../public-booking/public-booking.service.js';
import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { resolveEmployeeByName } from './ai-explain-provider-specialty.util.js';
import { parseSwitchProviderSameTimeFromPrompt } from './ai-switch-provider-same-time.util.js';
import type { SwitchProviderSameTimeMode } from './ai-switch-provider-same-time.fixtures.js';
import { resolveBusinessSlugFromParamsOrId } from './ai-resolve-business-slug.util.js';
import { formatTimeDisplay } from '../../common/utils/date-format.util.js';

export interface SwitchProviderSameTimeLogicDeps {
  employeeRepo: Pick<Repository<Employee>, 'find'>;
  serviceRepo: Pick<Repository<Service>, 'findOne'>;
  publicBookingService: Pick<PublicBookingService, 'getServiceDaySlots'>;
  businessRepo: Pick<Repository<Business>, 'findOne'>;
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

function resolveTimeSlot(
  params: Record<string, unknown>,
  prompt: string,
): string | undefined {
  const fromParams = params.timeSlot;
  if (typeof fromParams === 'string' && fromParams.trim()) {
    return fromParams.trim();
  }
  const startTime = params.startTime;
  if (typeof startTime === 'string' && startTime.trim()) {
    return formatTimeDisplay(startTime);
  }
  const parsed = parseSwitchProviderSameTimeFromPrompt(prompt, params);
  return parsed?.timeSlot;
}

function slotMatchesTime(slotIso: string, targetTime: string): boolean {
  return formatTimeDisplay(slotIso) === targetTime;
}

export function buildSwitchProviderSameTimeSummary(input: {
  mode: SwitchProviderSameTimeMode;
  employeeName: string;
  timeSlot: string;
  serviceName?: string | null;
}): string {
  const timeLabel = input.timeSlot;
  if (input.serviceName) {
    return `Switched to ${input.employeeName} for ${input.serviceName} at ${timeLabel}. Continue to checkout to confirm.`;
  }
  if (input.mode === 'keep_time_named_provider') {
    return `Switched to ${input.employeeName} at ${timeLabel}. Continue to checkout to confirm.`;
  }
  return `Found ${input.employeeName} at ${timeLabel}. Continue to checkout to confirm.`;
}

export async function handleSwitchProviderSameTimeLogic(
  deps: SwitchProviderSameTimeLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const parsed = parseSwitchProviderSameTimeFromPrompt(
    prompt || String(params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'switch_provider_same_time',
      'Say you want to keep your time but switch stylist, for example "Keep 3pm but different stylist".',
      { clarify: true, missing: ['mode'] },
    );
  }

  // e2e-bug.82 — resolve slug from businessId when classifier omits params.slug.
  const slug = await resolveBusinessSlugFromParamsOrId(
    deps.businessRepo,
    businessId,
    params,
  );
  if (!slug) {
    return failure('switch_provider_same_time', 'Business not found.', {
      mode: parsed.mode,
    });
  }

  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId : undefined;
  if (!serviceId) {
    return failure(
      'switch_provider_same_time',
      'Choose a service first, then ask to keep the same time with a different stylist.',
      { clarify: true, mode: parsed.mode, missing: ['serviceId'] },
    );
  }

  const date = typeof params.date === 'string' ? params.date : undefined;
  if (!date) {
    return failure(
      'switch_provider_same_time',
      'Pick a date first, then ask to keep the same time with a different stylist.',
      { clarify: true, mode: parsed.mode, missing: ['date'] },
    );
  }

  const timeSlot = resolveTimeSlot(params, prompt);
  if (!timeSlot) {
    return failure(
      'switch_provider_same_time',
      'Which time should stay the same? For example "Keep 3pm but different stylist".',
      { clarify: true, mode: parsed.mode, missing: ['timeSlot'] },
    );
  }

  const excludeEmployeeId =
    (typeof params.excludeEmployeeId === 'string'
      ? params.excludeEmployeeId
      : undefined) ??
    (typeof params.employeeId === 'string' ? params.employeeId : undefined);

  const service = await deps.serviceRepo.findOne({
    where: { id: serviceId, businessId, isActive: true },
  });
  if (!service) {
    return failure('switch_provider_same_time', 'Service not found.', {
      mode: parsed.mode,
      serviceId,
    });
  }

  const daySlots = await deps.publicBookingService.getServiceDaySlots(
    slug,
    serviceId,
    date,
  );

  let candidates = daySlots.slots.filter((slot) =>
    slotMatchesTime(slot.startTime, timeSlot),
  );
  if (excludeEmployeeId) {
    candidates = candidates.filter(
      (slot) => slot.employeeId !== excludeEmployeeId,
    );
  }

  if (parsed.mode === 'keep_time_named_provider' && parsed.providerName) {
    const employees = await deps.employeeRepo.find({
      where: { businessId, isActive: true },
      order: { name: 'ASC' },
    });
    const target = resolveEmployeeByName(employees, parsed.providerName);
    if (!target) {
      return failure(
        'switch_provider_same_time',
        `I couldn't find a stylist named ${parsed.providerName}. Available: ${employees.map((entry) => entry.name).join(', ') || 'none yet'}.`,
        {
          mode: parsed.mode,
          providerName: parsed.providerName,
          availableProviders: employees.map((entry) => entry.name),
        },
      );
    }
    candidates = candidates.filter((slot) => slot.employeeId === target.id);
  }

  const chosen = candidates[0];
  if (!chosen) {
    return failure(
      'switch_provider_same_time',
      parsed.mode === 'keep_time_named_provider' && parsed.providerName
        ? `${parsed.providerName} is not available at ${timeSlot} on that day. Try another time or stylist.`
        : `No other stylist is available at ${timeSlot} on that day. Try a nearby time or another day.`,
      {
        mode: parsed.mode,
        timeSlot,
        date,
        serviceId,
        ...(parsed.providerName ? { providerName: parsed.providerName } : {}),
      },
    );
  }

  const summary = buildSwitchProviderSameTimeSummary({
    mode: parsed.mode,
    employeeName: chosen.employeeName,
    timeSlot,
    serviceName: service.name,
  });

  return success('switch_provider_same_time', summary, {
    mode: parsed.mode,
    serviceId: service.id,
    serviceName: service.name,
    employeeId: chosen.employeeId,
    employeeName: chosen.employeeName,
    startTime: chosen.startTime,
    date,
    timeSlot,
    ...(excludeEmployeeId ? { previousEmployeeId: excludeEmployeeId } : {}),
    ...(parsed.providerName ? { providerName: parsed.providerName } : {}),
    navigate: {
      path: 'checkout',
      query: {
        serviceId: service.id,
        employeeId: chosen.employeeId,
        startTime: chosen.startTime,
      },
    },
  });
}
