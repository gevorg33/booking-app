import {
  isExplainMultiServiceSettingsPrompt,
  rescueExplainMultiServiceSettingsIntent,
} from './ai-explain-multi-service-settings.util.js';

export const DASHBOARD_RESOURCE_MUTATE_INTENTS = [
  'create_resource',
  'update_resource',
  'deactivate_resource',
  'assign_resource_hours',
  'set_service_resource_requirements',
  'configure_multi_service_scheduling_mode',
  'block_resource_unavailable',
] as const;

export const DASHBOARD_RESOURCE_READ_INTENTS = [
  'list_scheduling_resources',
  'list_service_resource_requirements',
  'list_resource_conflicts',
  'explain_resource_conflict',
  'explain_multi_service_settings',
] as const;

export const PROVIDER_RESOURCE_INTENTS = ['my_resource_assignments'] as const;

export const CUSTOMER_AVAILABILITY_INTENTS = [
  'check_multi_service_block_availability',
  'check_package_line_availability',
  'earliest_slot_all_services',
  'providers_available_later_days',
  'explain_why_no_slots',
] as const;

export const SCHEDULE_RESOURCE_INTENTS = [
  ...DASHBOARD_RESOURCE_MUTATE_INTENTS,
  ...DASHBOARD_RESOURCE_READ_INTENTS,
  ...PROVIDER_RESOURCE_INTENTS,
  ...CUSTOMER_AVAILABILITY_INTENTS,
] as const;

export type ScheduleResourceIntent = (typeof SCHEDULE_RESOURCE_INTENTS)[number];

export interface ScheduleResourceCompoundStep {
  action: ScheduleResourceIntent;
  params: Record<string, unknown>;
  segment: string;
}

const SCHEDULE_VERB =
  /\b(list|show|create|add|update|rename|deactivate|remove|assign|configure|check|explain|earliest|which|what|block|my)\b/i;

const COMPOUND_SPLIT =
  /\s*;\s*|\s+and\s+(?=(?:list|show|create|add|update|deactivate|assign|configure|check|explain|earliest|which|what|block|my)\b)/i;

export function isScheduleResourceIntent(
  action: string,
): action is ScheduleResourceIntent {
  return (SCHEDULE_RESOURCE_INTENTS as readonly string[]).includes(action);
}

export function isListSchedulingResourcesPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    /\b(scheduling\s+)?resources?\b/i.test(prompt) &&
    !/\bconflicts?\b/i.test(prompt) &&
    !/\bassignments?\b/i.test(prompt) &&
    !/\brequirements?\b/i.test(prompt) &&
    !/\bequipment\b/i.test(prompt)
  );
}

/** e2e-bug.147 — READ configured resource requirements for a named service. */
export function isListServiceResourceRequirementsPrompt(
  prompt: string,
): boolean {
  if (
    /\b(set|configure|assign|update|change|replace|link|attach|create|add)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (/\bconflicts?\b/i.test(prompt) || /\bassignments?\b/i.test(prompt)) {
    return false;
  }
  const hasReadCue =
    /\b(what|which|list|show|explain|describe|tell|does|do|how)\b/i.test(
      prompt,
    ) ||
    /\b(resources?|equipment|rooms?|chairs?|stations?)\s+(?:required|needed|requirements?)\s+for\b/i.test(
      prompt,
    );
  const hasRequireCue =
    /\b(require|requires|required|requirement|requirements|need|needs|needed)\b/i.test(
      prompt,
    );
  const hasResourceCue =
    /\b(resource|resources|equipment|room|rooms|chair|chairs|station|stations)\b/i.test(
      prompt,
    );
  return hasReadCue && hasRequireCue && hasResourceCue;
}

export function extractServiceNameForResourceRequirements(
  prompt: string,
): string | null {
  const patterns = [
    /\b(?:what|which)\s+(?:equipment|resources?|rooms?|chairs?|stations?)\s+(?:does|do)\s+(?:the\s+)?(.+?)\s+service\s+require/i,
    /\b(?:what|which)\s+(?:equipment|resources?|rooms?|chairs?|stations?)\s+(?:are\s+)?(?:required|needed)\s+for\s+(?:the\s+)?(.+?)(?:\s+service)?(?:\?|$)/i,
    /\b(?:resources?|equipment|rooms?|chairs?)\s+(?:required|needed|requirements?)\s+for\s+(?:the\s+)?(.+?)(?:\s+service)?(?:\?|$)/i,
    /\b(?:list|show|explain|describe)\s+(?:the\s+)?(?:resource\s+)?requirements?\s+for\s+(?:the\s+)?(.+?)(?:\s+service)?(?:\?|$)/i,
    /\b(?:does|do)\s+(?:the\s+)?(.+?)\s+service\s+(?:require|need)\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const name = match?.[1]?.trim().replace(/[?.!,;:]+$/, '');
    if (name && name.length >= 2 && name.length <= 80) return name;
  }
  const quoted = prompt.match(/"([^"]{1,60})"/);
  return quoted?.[1]?.trim() ?? null;
}

export function enrichListServiceResourceRequirementsParamsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): Record<string, unknown> {
  const next = { ...params };
  if (
    typeof next.serviceName !== 'string' ||
    !String(next.serviceName).trim()
  ) {
    const serviceName = extractServiceNameForResourceRequirements(prompt);
    if (serviceName) next.serviceName = serviceName;
  }
  return next;
}

export function isCreateResourcePrompt(prompt: string): boolean {
  return (
    /\b(create|add)\b/i.test(prompt) &&
    /\b(room|chair|resource|station)\b/i.test(prompt) &&
    !/\b(template|schedule)\b/i.test(prompt)
  );
}

export function isUpdateResourcePrompt(prompt: string): boolean {
  return (
    /\b(update|rename)\b/i.test(prompt) &&
    /\b(room|chair|resource|station)\b/i.test(prompt) &&
    !/\b(deactivate|remove|block)\b/i.test(prompt)
  );
}

export function isDeactivateResourcePrompt(prompt: string): boolean {
  return (
    /\b(deactivate|remove|delete|retire)\b/i.test(prompt) &&
    /\b(room|chair|resource|station)\b/i.test(prompt) &&
    !/\bblock\b/i.test(prompt)
  );
}

export function isAssignResourceHoursPrompt(prompt: string): boolean {
  return (
    /\b(assign|link|attach)\b/i.test(prompt) &&
    /\b(resource|room|chair|station)\b/i.test(prompt) &&
    /\b(service|hours?|requirement)\b/i.test(prompt)
  );
}

export function isListResourceConflictsPrompt(prompt: string): boolean {
  return (
    /\b(list|show|find)\b/i.test(prompt) &&
    /\bresource\b/i.test(prompt) &&
    /\bconflicts?\b/i.test(prompt)
  );
}

export function isExplainResourceConflictPrompt(prompt: string): boolean {
  return (
    /\b(explain|why|describe)\b/i.test(prompt) &&
    /\bresource\b/i.test(prompt) &&
    /\bconflict/i.test(prompt)
  );
}

export function isConfigureMultiServiceSchedulingModePrompt(
  prompt: string,
): boolean {
  return (
    /\b(configure|set|switch|change)\b/i.test(prompt) &&
    /\b(multi[\s-]?service|same[\s-]?visit|per[\s-]?service)\b/i.test(prompt) &&
    /\b(scheduling\s+mode|scheduling)\b/i.test(prompt)
  );
}

export function isMyResourceAssignmentsPrompt(prompt: string): boolean {
  return (
    /\bmy\b/i.test(prompt) &&
    /\b(resource|room|chair)\b/i.test(prompt) &&
    /\b(assignments?|bookings?)\b/i.test(prompt)
  );
}

export function isBlockResourceUnavailablePrompt(prompt: string): boolean {
  return (
    /\b(block|mark|take)\b/i.test(prompt) &&
    /\b(resource|room|chair|station)\b/i.test(prompt) &&
    /\b(unavailable|offline|down|out)\b/i.test(prompt)
  );
}

export function isCheckMultiServiceBlockAvailabilityPrompt(
  prompt: string,
): boolean {
  return (
    /\b(check|show|find|what)\b/i.test(prompt) &&
    /\b(multi[\s-]?service|services?)\b/i.test(prompt) &&
    /\b(block|slot|availability|available|times?)\b/i.test(prompt) &&
    !/\bpackage\b/i.test(prompt)
  );
}

export function isCheckPackageLineAvailabilityPrompt(prompt: string): boolean {
  return (
    /\b(check|show|find|what)\b/i.test(prompt) &&
    /\bpackage\b/i.test(prompt) &&
    /\b(line|slot|availability|available|visit|times?)\b/i.test(prompt)
  );
}

export function isEarliestSlotAllServicesPrompt(prompt: string): boolean {
  return (
    /\b(earliest|first|next|soonest)\b/i.test(prompt) &&
    /\b(slot|time|appointment|opening)\b/i.test(prompt) &&
    /\b(all\s+services?|multi[\s-]?service|both\s+services?)\b/i.test(prompt)
  );
}

export function isProvidersAvailableLaterDaysPrompt(prompt: string): boolean {
  return (
    /\b(which|what|any)\b/i.test(prompt) &&
    /\b(providers?|specialists?|stylists?)\b/i.test(prompt) &&
    /\b(later|another|other)\s+days?\b/i.test(prompt)
  );
}

export function isExplainWhyNoSlotsPrompt(prompt: string): boolean {
  return (
    /\b(why|explain)\b/i.test(prompt) &&
    /\b(no\s+slots?|nothing\s+available|unavailable|can't\s+book)\b/i.test(
      prompt,
    )
  );
}

export function isScheduleResourceCompoundPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length < 20 || !SCHEDULE_VERB.test(trimmed)) return false;
  return (
    COMPOUND_SPLIT.test(trimmed) ||
    decomposeScheduleResourceCompoundPrompt(trimmed).length > 1
  );
}

export function extractResourceNameFromPrompt(prompt: string): string | null {
  const room = prompt.match(
    /\b(?:room|chair|station|resource)\s+([A-Za-z0-9][\w\s'-]{0,30}?)(?:\s+(?:to|for|is|on)|$)/i,
  );
  if (room) return room[1].trim();
  const quoted = prompt.match(/"([^"]{1,40})"/);
  return quoted?.[1]?.trim() ?? null;
}

export function extractResourceTypeFromPrompt(prompt: string): string | null {
  if (/\bchair\b/i.test(prompt)) return 'chair';
  if (/\bstation\b/i.test(prompt)) return 'station';
  if (/\broom\b/i.test(prompt)) return 'room';
  return null;
}

export function extractSchedulingModeFromPrompt(
  prompt: string,
): 'same_visit' | 'per_service' | null {
  if (/\bper[\s-]?service\b/i.test(prompt)) return 'per_service';
  if (/\bsame[\s-]?visit\b/i.test(prompt)) return 'same_visit';
  return null;
}

export function extractServiceNamesFromPrompt(prompt: string): string[] {
  const names: string[] = [];
  const quoted = [...prompt.matchAll(/"([^"]{1,60})"/g)].map((m) =>
    m[1].trim(),
  );
  names.push(...quoted);
  const plus = prompt.match(/\b([\w\s+]+)\s*\+\s*([\w\s+]+)\b/i);
  if (plus) {
    names.push(plus[1].trim(), plus[2].trim());
  }
  return [...new Set(names.filter(Boolean))];
}

export type ScheduleResourceRescue = {
  action: ScheduleResourceIntent;
  rescueReason: string;
  params?: Record<string, unknown>;
};

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescueScheduleResourceIntent(
  prompt: string,
  action: string,
): ScheduleResourceRescue | null {
  // e2e-bug.147 — before isScheduleResourceIntent early-return so nearby
  // list_scheduling_resources / react_agent misroutes still rescue.
  if (isListServiceResourceRequirementsPrompt(prompt)) {
    const params = enrichListServiceResourceRequirementsParamsFromPrompt(
      prompt,
      {},
    );
    if (action !== 'list_service_resource_requirements') {
      return {
        action: 'list_service_resource_requirements',
        rescueReason: 'list_service_resource_requirements',
        params,
      };
    }
    if (params.serviceName) {
      return {
        action: 'list_service_resource_requirements',
        rescueReason: 'list_service_resource_requirements_params',
        params,
      };
    }
  }

  if (isScheduleResourceIntent(action)) return null;
  if (isScheduleResourceCompoundPrompt(prompt) && action !== 'compound_intent')
    return null;

  if (isExplainWhyNoSlotsPrompt(prompt))
    return { action: 'explain_why_no_slots', rescueReason: 'no_slots' };
  if (isProvidersAvailableLaterDaysPrompt(prompt)) {
    return {
      action: 'providers_available_later_days',
      rescueReason: 'later_days',
    };
  }
  if (isEarliestSlotAllServicesPrompt(prompt)) {
    return {
      action: 'earliest_slot_all_services',
      rescueReason: 'earliest_slot',
    };
  }
  if (isCheckPackageLineAvailabilityPrompt(prompt)) {
    return {
      action: 'check_package_line_availability',
      rescueReason: 'package_lines',
    };
  }
  if (isCheckMultiServiceBlockAvailabilityPrompt(prompt)) {
    return {
      action: 'check_multi_service_block_availability',
      rescueReason: 'multi_service_block',
    };
  }

  if (isMyResourceAssignmentsPrompt(prompt))
    return { action: 'my_resource_assignments', rescueReason: 'my_resources' };
  if (isBlockResourceUnavailablePrompt(prompt)) {
    return {
      action: 'block_resource_unavailable',
      rescueReason: 'block_resource',
    };
  }

  if (isExplainResourceConflictPrompt(prompt)) {
    return {
      action: 'explain_resource_conflict',
      rescueReason: 'explain_conflict',
    };
  }
  const explainMultiService = rescueExplainMultiServiceSettingsIntent(
    prompt,
    action,
  );
  if (explainMultiService) return explainMultiService;
  if (isListResourceConflictsPrompt(prompt))
    return {
      action: 'list_resource_conflicts',
      rescueReason: 'list_conflicts',
    };
  if (
    isConfigureMultiServiceSchedulingModePrompt(prompt) &&
    action !== 'configure_multi_service_settings'
  ) {
    return {
      action: 'configure_multi_service_scheduling_mode',
      rescueReason: 'scheduling_mode',
    };
  }
  if (isAssignResourceHoursPrompt(prompt))
    return { action: 'assign_resource_hours', rescueReason: 'assign_hours' };
  if (isDeactivateResourcePrompt(prompt))
    return {
      action: 'deactivate_resource',
      rescueReason: 'deactivate_resource',
    };
  if (isUpdateResourcePrompt(prompt))
    return { action: 'update_resource', rescueReason: 'update_resource' };
  if (isCreateResourcePrompt(prompt))
    return { action: 'create_resource', rescueReason: 'create_resource' };
  if (isListSchedulingResourcesPrompt(prompt)) {
    return {
      action: 'list_scheduling_resources',
      rescueReason: 'list_resources',
    };
  }

  return null;
}

function classifyScheduleSegment(
  segment: string,
): ScheduleResourceCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  const base: Record<string, unknown> = {};
  const resourceName = extractResourceNameFromPrompt(text);
  if (resourceName) base.resourceName = resourceName;
  const serviceNames = extractServiceNamesFromPrompt(text);
  if (serviceNames.length) base.serviceNames = serviceNames;
  const schedulingMode = extractSchedulingModeFromPrompt(text);
  if (schedulingMode) base.schedulingMode = schedulingMode;

  if (isListServiceResourceRequirementsPrompt(text)) {
    return {
      action: 'list_service_resource_requirements',
      params: enrichListServiceResourceRequirementsParamsFromPrompt(text, base),
      segment: text,
    };
  }
  if (isListSchedulingResourcesPrompt(text)) {
    return { action: 'list_scheduling_resources', params: {}, segment: text };
  }
  if (isListResourceConflictsPrompt(text)) {
    return { action: 'list_resource_conflicts', params: base, segment: text };
  }
  if (isExplainResourceConflictPrompt(text)) {
    return { action: 'explain_resource_conflict', params: base, segment: text };
  }
  if (isExplainMultiServiceSettingsPrompt(text)) {
    return {
      action: 'explain_multi_service_settings',
      params: {},
      segment: text,
    };
  }
  if (isCreateResourcePrompt(text)) {
    return {
      action: 'create_resource',
      params: { ...base, resourceType: extractResourceTypeFromPrompt(text) },
      segment: text,
    };
  }
  if (isAssignResourceHoursPrompt(text)) {
    return { action: 'assign_resource_hours', params: base, segment: text };
  }
  if (isConfigureMultiServiceSchedulingModePrompt(text)) {
    return {
      action: 'configure_multi_service_scheduling_mode',
      params: base,
      segment: text,
    };
  }
  if (isCheckMultiServiceBlockAvailabilityPrompt(text)) {
    return {
      action: 'check_multi_service_block_availability',
      params: base,
      segment: text,
    };
  }
  if (isCheckPackageLineAvailabilityPrompt(text)) {
    return {
      action: 'check_package_line_availability',
      params: base,
      segment: text,
    };
  }
  if (isEarliestSlotAllServicesPrompt(text)) {
    return {
      action: 'earliest_slot_all_services',
      params: base,
      segment: text,
    };
  }
  if (isMyResourceAssignmentsPrompt(text)) {
    return { action: 'my_resource_assignments', params: {}, segment: text };
  }
  return null;
}

/** Deterministic multi-command split for schedule / resource operations. */
export function decomposeScheduleResourceCompoundPrompt(
  prompt: string,
): ScheduleResourceCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const segments = trimmed.split(COMPOUND_SPLIT).map((s) => s.trim());

  const nonEmpty = segments.filter(Boolean);

  if (nonEmpty.length <= 1) {
    const single = classifyScheduleSegment(trimmed);
    return single ? [single] : [];
  }

  const steps: ScheduleResourceCompoundStep[] = [];
  for (const segment of segments) {
    const step = classifyScheduleSegment(segment);
    if (step) steps.push(step);
  }
  return steps;
}
