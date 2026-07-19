import { Repository, Between, In, Not } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { SchedulingResource } from '../resources/entities/scheduling-resource.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { SchedulingResourcesService } from '../resources/scheduling-resources.service.js';
import type { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import type { PublicBookingService } from '../public-booking/public-booking.service.js';
import {
  applyMultiServiceSettingsToBusinessSettings,
  mergeMultiServiceSettingsPatch,
  resolveMultiServiceSettings,
} from '../../common/utils/multi-service-settings.util.js';
import {
  decomposeScheduleResourceCompoundPrompt,
  type ScheduleResourceCompoundStep,
} from './ai-schedule-resources.util.js';
import { handleExplainMultiServiceSettingsLogic } from './ai-explain-multi-service-settings.logic.js';

export interface Sprint29ScheduleResourceLogicDeps {
  resourcesService: SchedulingResourcesService;
  multiServiceBookingsService: MultiServiceBookingsService;
  publicBookingService: PublicBookingService;
  businessRepo: Repository<Business>;
  serviceRepo: Repository<Service>;
  resourceRepo: Repository<SchedulingResource>;
  bookingRepo: Repository<Booking>;
}

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

function resolveByName<T extends { name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

async function resolveBusinessSlug(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

async function resolveServiceIds(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<string[]> {
  if (Array.isArray(params.serviceIds) && params.serviceIds.length) {
    return params.serviceIds as string[];
  }
  const names = (params.serviceNames as string[] | undefined) ?? [];
  if (!names.length && params.serviceName)
    names.push(params.serviceName as string);
  if (!names.length) return [];
  const services = await deps.serviceRepo.find({ where: { businessId } });
  const ids: string[] = [];
  for (const name of names) {
    const svc = resolveByName(services, name);
    if (svc) ids.push(svc.id);
  }
  return ids;
}

async function resolveResource(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<SchedulingResource | undefined> {
  if (params.resourceId) {
    const resource = await deps.resourceRepo.findOne({
      where: { id: params.resourceId as string, businessId },
    });
    return resource ?? undefined;
  }
  const name = params.resourceName as string | undefined;
  if (!name) return undefined;
  const resources = await deps.resourceRepo.find({ where: { businessId } });
  return resolveByName(resources, name);
}

function parseTimeRange(
  params: Record<string, any>,
): { start: Date; end: Date } | null {
  const startRaw = params.startTime ?? params.dateTime;
  const endRaw = params.endTime;
  if (!startRaw) return null;
  const start = new Date(startRaw as string);
  if (Number.isNaN(start.getTime())) return null;
  const end = endRaw
    ? new Date(endRaw as string)
    : new Date(start.getTime() + 60 * 60 * 1000);
  if (Number.isNaN(end.getTime())) return null;
  return { start, end };
}

export async function handleListSchedulingResourcesLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const resources = await deps.resourcesService.listResources(businessId);
  return success(
    'list_scheduling_resources',
    resources.length
      ? `${resources.length} active scheduling resource(s).`
      : 'No active scheduling resources.',
    { resources, count: resources.length },
  );
}

export async function handleCreateResourceLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const name = (params.resourceName as string | undefined)?.trim();
  if (!name) {
    return failure(
      'create_resource',
      'Specify a resource name (e.g. "Create room Treatment 2").',
      {
        clarify: true,
        missing: ['resourceName'],
      },
    );
  }
  const resource = await deps.resourcesService.createResource(businessId, {
    name,
    resourceType: (params.resourceType as string | undefined) ?? 'room',
    locationId: (params.locationId as string | null | undefined) ?? null,
  });
  return success(
    'create_resource',
    `Created scheduling resource "${resource.name}".`,
    { resource },
  );
}

export async function handleUpdateResourceLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const resource = await resolveResource(deps, businessId, params);
  if (!resource) {
    return failure('update_resource', 'Specify which resource to update.', {
      clarify: true,
      missing: ['resourceName'],
    });
  }
  const updated = await deps.resourcesService.updateResource(
    businessId,
    resource.id,
    {
      name:
        (params.newName as string | undefined) ??
        (params.resourceName as string | undefined),
      resourceType: params.resourceType as string | undefined,
      locationId: params.locationId as string | null | undefined,
    },
  );
  return success('update_resource', `Updated resource "${updated.name}".`, {
    resource: updated,
  });
}

export async function handleDeactivateResourceLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const resource = await resolveResource(deps, businessId, params);
  if (!resource) {
    return failure(
      'deactivate_resource',
      'Specify which resource to deactivate.',
      {
        clarify: true,
        missing: ['resourceName'],
      },
    );
  }
  await deps.resourcesService.deactivateResource(businessId, resource.id);
  return success(
    'deactivate_resource',
    `Deactivated resource "${resource.name}".`,
    { resourceId: resource.id },
  );
}

export async function handleAssignResourceHoursLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  services: Service[],
): Promise<CommandResult> {
  const resource = await resolveResource(deps, businessId, params);
  const serviceName =
    (params.serviceName as string | undefined) ??
    (params.serviceNames as string[] | undefined)?.[0];
  const service = params.serviceId
    ? services.find((s) => s.id === params.serviceId)
    : serviceName
      ? resolveByName(services, serviceName)
      : undefined;

  if (!resource || !service) {
    return failure(
      'assign_resource_hours',
      'Specify resource and service (e.g. "Assign room 2 to facial service").',
      { clarify: true, missing: ['resourceName', 'serviceName'] },
    );
  }

  const rows = await deps.resourcesService.setServiceRequirements(
    businessId,
    service.id,
    [resource.id],
  );
  return success(
    'assign_resource_hours',
    `Linked "${resource.name}" to "${service.name}" — resource required for this service.`,
    { resourceId: resource.id, serviceId: service.id, requirements: rows },
  );
}

/** e2e-bug.147 — READ configured requirements (never invent typical equipment). */
export async function handleListServiceResourceRequirementsLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  services: Service[],
): Promise<CommandResult> {
  const serviceName =
    (params.serviceName as string | undefined) ??
    (params.serviceNames as string[] | undefined)?.[0];
  const service = params.serviceId
    ? services.find((s) => s.id === params.serviceId)
    : serviceName
      ? resolveByName(services, serviceName)
      : undefined;

  if (!service) {
    return failure(
      'list_service_resource_requirements',
      'Specify which service to look up resource requirements for.',
      { clarify: true, missing: ['serviceName'] },
    );
  }

  try {
    const rows = await deps.resourcesService.getServiceRequirements(
      businessId,
      service.id,
    );
    const named = rows.map((row) => ({
      resourceId: row.resourceId,
      resourceName: row.resource?.name ?? row.resourceId,
      quantity: row.quantity ?? 1,
    }));
    if (named.length === 0) {
      return success(
        'list_service_resource_requirements',
        `"${service.name}" has no configured scheduling resource requirements in this business.`,
        {
          serviceId: service.id,
          serviceName: service.name,
          requirements: [],
          count: 0,
        },
      );
    }
    const labels = named.map(
      (r) => (r.quantity > 1 ? `${r.quantity}× ` : '') + r.resourceName,
    );
    return success(
      'list_service_resource_requirements',
      `"${service.name}" requires: ${labels.join(', ')}.`,
      {
        serviceId: service.id,
        serviceName: service.name,
        requirements: named,
        count: named.length,
      },
    );
  } catch (err: any) {
    return failure(
      'list_service_resource_requirements',
      err?.message ?? 'Could not load service resource requirements.',
    );
  }
}

export async function handleSetServiceResourceRequirementsLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
  services: Service[],
): Promise<CommandResult> {
  const serviceName =
    (params.serviceName as string | undefined) ??
    (params.serviceNames as string[] | undefined)?.[0];
  const service = params.serviceId
    ? services.find((s) => s.id === params.serviceId)
    : serviceName
      ? resolveByName(services, serviceName)
      : undefined;

  if (!service) {
    return failure(
      'set_service_resource_requirements',
      'Specify which service these resource requirements apply to.',
      { clarify: true, missing: ['serviceName'] },
    );
  }

  const resourceIdsParam = Array.isArray(params.resourceIds)
    ? params.resourceIds.filter(
        (id): id is string => typeof id === 'string',
      )
    : [];
  const resourceNames = Array.isArray(params.resourceNames)
    ? params.resourceNames.filter(
        (name): name is string => typeof name === 'string',
      )
    : [];

  if (resourceIdsParam.length === 0 && resourceNames.length === 0) {
    return failure(
      'set_service_resource_requirements',
      `Which resources does "${service.name}" require? Provide resourceIds or resourceNames.`,
      { clarify: true, missing: ['resourceIds', 'resourceNames'] },
    );
  }

  let resolvedIds = resourceIdsParam;
  if (resolvedIds.length === 0) {
    const resources = await deps.resourceRepo.find({ where: { businessId } });
    resolvedIds = resourceNames
      .map((name) => {
        const needle = name.toLowerCase();
        return (
          resources.find((r) => r.name.toLowerCase() === needle) ??
          resources.find((r) => r.name.toLowerCase().includes(needle))
        )?.id;
      })
      .filter((id): id is string => !!id);

    if (resolvedIds.length === 0) {
      return failure(
        'set_service_resource_requirements',
        `None of the given resource names matched the catalog for "${service.name}".`,
      );
    }
  }

  try {
    const rows = await deps.resourcesService.setServiceRequirements(
      businessId,
      service.id,
      resolvedIds,
    );
    return success(
      'set_service_resource_requirements',
      `Set ${resolvedIds.length} required resource${resolvedIds.length === 1 ? '' : 's'} for "${service.name}".`,
      { serviceId: service.id, requirements: rows },
    );
  } catch (err: any) {
    return failure(
      'set_service_resource_requirements',
      err?.message ?? 'Could not set the service resource requirements.',
    );
  }
}

export async function handleListResourceConflictsLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const range = parseTimeRange(params);
  if (!range) {
    return failure(
      'list_resource_conflicts',
      'Specify startTime (and optional endTime) for the conflict window.',
      {
        clarify: true,
        missing: ['startTime'],
      },
    );
  }

  const resource = await resolveResource(deps, businessId, params);
  const resourceIds = resource
    ? [resource.id]
    : (await deps.resourcesService.listResources(businessId)).map((r) => r.id);

  if (!resourceIds.length) {
    return success(
      'list_resource_conflicts',
      'No scheduling resources configured.',
      { conflicts: [], count: 0 },
    );
  }

  const conflictIds = await deps.resourcesService.findConflictingResourceIds(
    businessId,
    resourceIds,
    range.start,
    range.end,
  );

  return success(
    'list_resource_conflicts',
    conflictIds.length
      ? `${conflictIds.length} resource conflict(s) in this window.`
      : 'No resource conflicts in this window.',
    {
      conflictResourceIds: conflictIds,
      count: conflictIds.length,
      window: range,
    },
  );
}

export async function handleExplainResourceConflictLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const list = await handleListResourceConflictsLogic(deps, businessId, params);
  if (!list.success) return list;

  const range = parseTimeRange(params)!;
  const conflictIds = (list.details as any).conflictResourceIds as string[];
  if (!conflictIds.length) {
    return success(
      'explain_resource_conflict',
      'No resource conflicts — rooms/chairs are free in that window.',
      {
        explanations: [],
      },
    );
  }

  const resources = await deps.resourceRepo.find({
    where: { id: In(conflictIds), businessId },
  });
  const explanations = resources.map((resource) => ({
    resourceId: resource.id,
    resourceName: resource.name,
    reason: `"${resource.name}" is already booked during ${range.start.toISOString()} – ${range.end.toISOString()}.`,
  }));

  return success(
    'explain_resource_conflict',
    explanations.map((e) => e.reason).join(' '),
    { explanations, count: explanations.length, window: range },
  );
}

export async function handleConfigureMultiServiceSchedulingModeLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business)
    return failure(
      'configure_multi_service_scheduling_mode',
      'Business not found.',
    );

  const mode = params.schedulingMode as
    | 'same_visit'
    | 'per_service'
    | undefined;
  if (!mode || (mode !== 'same_visit' && mode !== 'per_service')) {
    return failure(
      'configure_multi_service_scheduling_mode',
      'Specify schedulingMode: same_visit or per_service.',
      { clarify: true, missing: ['schedulingMode'] },
    );
  }

  const current = resolveMultiServiceSettings(business.settings ?? {});
  const merged = mergeMultiServiceSettingsPatch(current, {
    enabled: true,
    schedulingMode: mode,
  });
  business.settings = applyMultiServiceSettingsToBusinessSettings(
    business.settings ?? {},
    merged,
  );
  await deps.businessRepo.save(business);

  return success(
    'configure_multi_service_scheduling_mode',
    `Multi-service scheduling mode set to ${mode.replace('_', ' ')}.`,
    { schedulingMode: mode, settings: merged },
  );
}

export async function handleMyResourceAssignmentsLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const employeeId =
    (params.sessionEmployeeId as string | undefined) ??
    (params.employeeId as string | undefined);
  if (!employeeId) {
    return failure(
      'my_resource_assignments',
      'Sign in as a provider to view resource assignments.',
      { clarify: true },
    );
  }

  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      employeeId,
      status: Not(BookingStatus.CANCELLED),
      startTime: Between(now, end),
    },
    order: { startTime: 'ASC' },
    take: 30,
  });

  const assignments: Array<{
    bookingId: string;
    startTime: Date;
    resources: unknown[];
  }> = [];
  for (const booking of bookings) {
    const resources = await deps.resourcesService.getBookingResources(
      booking.id,
    );
    if (resources.length) {
      assignments.push({
        bookingId: booking.id,
        startTime: booking.startTime,
        resources,
      });
    }
  }

  return success(
    'my_resource_assignments',
    assignments.length
      ? `You have ${assignments.length} upcoming booking(s) with assigned resources.`
      : 'No resource assignments on your upcoming bookings.',
    { assignments, count: assignments.length },
  );
}

export async function handleBlockResourceUnavailableLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const resource = await resolveResource(deps, businessId, params);
  if (!resource) {
    return failure(
      'block_resource_unavailable',
      'Specify which resource to mark unavailable.',
      {
        clarify: true,
        missing: ['resourceName'],
      },
    );
  }
  await deps.resourcesService.deactivateResource(businessId, resource.id);
  return success(
    'block_resource_unavailable',
    `"${resource.name}" marked unavailable — deactivate until re-enabled in settings.`,
    { resourceId: resource.id },
  );
}

export async function handleCheckMultiServiceBlockAvailabilityLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure(
      'check_multi_service_block_availability',
      'Business not found.',
    );

  const serviceIds = await resolveServiceIds(deps, businessId, params);
  if (!serviceIds.length) {
    return failure(
      'check_multi_service_block_availability',
      'Specify which services to check (serviceNames or serviceIds).',
      {
        clarify: true,
        missing: ['serviceNames'],
      },
    );
  }

  try {
    if (params.date) {
      const day = await deps.publicBookingService.getMultiServiceBlockDaySlots(
        slug,
        serviceIds,
        params.date as string,
      );
      return success(
        'check_multi_service_block_availability',
        `${day.slots?.length ?? 0} block slot(s) on ${params.date}.`,
        { slots: day.slots, date: params.date, serviceIds },
      );
    }
    const block = await deps.publicBookingService.suggestMultiServiceBlock(
      slug,
      serviceIds,
    );
    return success(
      'check_multi_service_block_availability',
      `Next available block: ${block.startTime} with ${block.employeeName}.`,
      { block, serviceIds },
    );
  } catch (err: any) {
    return failure(
      'check_multi_service_block_availability',
      err?.message ?? 'No multi-service blocks available for these services.',
      { serviceIds, reason: 'no_blocks' },
    );
  }
}

export async function handleCheckPackageLineAvailabilityLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure('check_package_line_availability', 'Business not found.');

  const packageId = params.packageId as string | undefined;
  if (!packageId) {
    return failure(
      'check_package_line_availability',
      'Specify packageId for per-line availability.',
      {
        clarify: true,
        missing: ['packageId'],
      },
    );
  }

  try {
    const lines = await deps.publicBookingService.suggestPackageLineSlots(
      slug,
      packageId,
    );
    return success(
      'check_package_line_availability',
      `${lines.lines.length} service line(s) in the suggested package block.`,
      { lines, packageId },
    );
  } catch (err: any) {
    return failure(
      'check_package_line_availability',
      err?.message ?? 'No package line slots available.',
      { packageId, reason: 'no_package_lines' },
    );
  }
}

export async function handleEarliestSlotAllServicesLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure('earliest_slot_all_services', 'Business not found.');

  const serviceIds = await resolveServiceIds(deps, businessId, params);
  if (!serviceIds.length) {
    return failure(
      'earliest_slot_all_services',
      'Specify services to find the earliest combined slot.',
      {
        clarify: true,
        missing: ['serviceNames'],
      },
    );
  }

  try {
    const block = await deps.publicBookingService.suggestMultiServiceBlock(
      slug,
      serviceIds,
    );
    return success(
      'earliest_slot_all_services',
      `Earliest block for all services: ${block.startTime} with ${block.employeeName}.`,
      { block, serviceIds },
    );
  } catch (err: any) {
    return failure(
      'earliest_slot_all_services',
      err?.message ?? 'No earliest slot found for all services.',
      {
        serviceIds,
      },
    );
  }
}

export async function handleProvidersAvailableLaterDaysLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug)
    return failure('providers_available_later_days', 'Business not found.');

  const serviceIds = await resolveServiceIds(deps, businessId, params);
  const startTime = (params.startTime ?? params.blockStartTime) as
    | string
    | undefined;
  if (!serviceIds.length || !startTime) {
    return failure(
      'providers_available_later_days',
      'Specify services and a reference startTime.',
      {
        clarify: true,
        missing: ['serviceNames', 'startTime'],
      },
    );
  }

  try {
    const result =
      await deps.publicBookingService.getMultiServiceBlockProviders(
        slug,
        serviceIds,
        startTime,
        true,
      );
    return success(
      'providers_available_later_days',
      result.providers.length
        ? `${result.providers.length} provider(s) available on later days.`
        : 'No providers available on later days for this block.',
      { ...result, serviceIds },
    );
  } catch (err: any) {
    return failure(
      'providers_available_later_days',
      err?.message ?? 'Could not check later-day providers.',
      {
        serviceIds,
      },
    );
  }
}

export async function handleExplainWhyNoSlotsLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) return failure('explain_why_no_slots', 'Business not found.');
  const settings =
    deps.multiServiceBookingsService.resolveSettingsFromBusiness(business);

  const serviceIds = await resolveServiceIds(deps, businessId, params);
  if (!serviceIds.length) {
    return failure(
      'explain_why_no_slots',
      'Specify which services you tried to book.',
      {
        clarify: true,
        missing: ['serviceNames'],
      },
    );
  }

  const check = await handleCheckMultiServiceBlockAvailabilityLogic(
    deps,
    businessId,
    params,
  );
  if (check.success) {
    return success(
      'explain_why_no_slots',
      'Slots are available — try the suggested block times.',
      {
        available: true,
        suggestion: check.details,
      },
    );
  }

  const reasons: string[] = [];
  if (!settings.enabled)
    reasons.push('Multi-service booking is not enabled for this salon.');
  if (serviceIds.length > settings.maxServiceCount) {
    reasons.push(
      `Too many services selected (max ${settings.maxServiceCount}).`,
    );
  }
  reasons.push(
    'No provider has a contiguous block long enough for all services.',
  );
  reasons.push(
    'Required rooms/chairs may be booked (check resource conflicts).',
  );

  return success('explain_why_no_slots', reasons.join(' '), {
    available: false,
    reasons,
    schedulingMode: settings.schedulingMode,
    serviceIds,
  });
}

export async function handleScheduleResourceCompoundLogic(
  deps: Sprint29ScheduleResourceLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  services: Service[],
  userId?: string,
): Promise<CommandResult> {
  const steps: ScheduleResourceCompoundStep[] =
    (params.compoundSteps as ScheduleResourceCompoundStep[] | undefined) ??
    decomposeScheduleResourceCompoundPrompt(prompt);

  if (steps.length < 2) {
    return failure(
      'compound_intent',
      'Could not split this into multiple schedule/resource commands. Try separating with "and" or semicolons.',
      { clarify: true },
    );
  }

  const results: CommandResult[] = [];
  for (const step of steps.slice(0, 4)) {
    const stepParams = { ...step.params, ...params };
    let result: CommandResult;
    switch (step.action) {
      case 'list_scheduling_resources':
        result = await handleListSchedulingResourcesLogic(deps, businessId);
        break;
      case 'list_service_resource_requirements':
        result = await handleListServiceResourceRequirementsLogic(
          deps,
          businessId,
          stepParams,
          services,
        );
        break;
      case 'create_resource':
        result = await handleCreateResourceLogic(deps, businessId, stepParams);
        break;
      case 'update_resource':
        result = await handleUpdateResourceLogic(deps, businessId, stepParams);
        break;
      case 'deactivate_resource':
        result = await handleDeactivateResourceLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'assign_resource_hours':
        result = await handleAssignResourceHoursLogic(
          deps,
          businessId,
          stepParams,
          services,
        );
        break;
      case 'list_resource_conflicts':
        result = await handleListResourceConflictsLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'explain_resource_conflict':
        result = await handleExplainResourceConflictLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'explain_multi_service_settings':
        result = await handleExplainMultiServiceSettingsLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'configure_multi_service_scheduling_mode':
        result = await handleConfigureMultiServiceSchedulingModeLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'my_resource_assignments':
        result = await handleMyResourceAssignmentsLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'block_resource_unavailable':
        result = await handleBlockResourceUnavailableLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'check_multi_service_block_availability':
        result = await handleCheckMultiServiceBlockAvailabilityLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'check_package_line_availability':
        result = await handleCheckPackageLineAvailabilityLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'earliest_slot_all_services':
        result = await handleEarliestSlotAllServicesLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'providers_available_later_days':
        result = await handleProvidersAvailableLaterDaysLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'explain_why_no_slots':
        result = await handleExplainWhyNoSlotsLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      default:
        result = failure(
          step.action,
          `Unsupported schedule compound step: ${step.action}.`,
        );
    }
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        action: 'compound_intent',
        summary: `Stopped at step ${results.length} (${step.action}): ${result.summary}`,
        details: {
          steps: results.map((r) => r.action),
          failedStep: step.action,
          userId,
        },
      };
    }
  }

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} schedule/resource step(s): ${results.map((r) => r.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((r) => ({ action: r.action, summary: r.summary })),
      decomposed: true,
      scheduleResourceCompound: true,
      userId,
    },
  };
}
