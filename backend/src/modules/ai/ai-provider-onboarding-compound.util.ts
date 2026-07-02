import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import { isOnboardProviderPrompt } from './ai-scheduling.util.js';
import {
  extractEmployeeNameFromPrompt,
  extractServiceNamesFromPrompt,
  isCreateEmployeePrompt,
  parseOnlineBookingEnabledFromPrompt,
} from './ai-staff-operations.util.js';
export const PROVIDER_ONBOARDING_COMPOUND_STEP_ACTIONS = [
  'create_employee',
  'assign_employee_services',
  'onboard_provider_schedule',
  'configure_online_booking',
] as const;

export type ProviderOnboardingCompoundStepAction =
  (typeof PROVIDER_ONBOARDING_COMPOUND_STEP_ACTIONS)[number];

export const PROVIDER_ONBOARDING_COMPOUND_RECIPE_ID = 'onboard_new_provider';

const PROVIDER_ONBOARDING_COMPOUND_MARKERS =
  /\band\s+then\b|\bthen\b|;\s*|\s+and\s+(?=(?:create|add|hire|assign|onboard|enable|schedule|configure|turn)\b)/i;

export const PROVIDER_ONBOARDING_COMPOUND_CLASSIFIER_RULES = `- onboard_new_provider (compound): dashboard multi-step provider onboarding — decomposes to create_employee → assign_employee_services → onboard_provider_schedule → configure_online_booking. Use for "onboard new stylist/therapist/barber/provider end-to-end", "set up Maria from scratch", "full provider setup: hire, assign services, first week schedule, enable online booking". NOT create_employee alone when user asks for full onboarding; NOT invite_staff_member (email invite only).`;

const PROVIDER_ROLE =
  /\b(?:stylist|therapist|barber|provider|specialist|esthetician|colorist|nail\s+tech|massage\s+therapist|team\s+member|staff\s+member|employee|new\s+hire)\b/i;

const FULL_ONBOARDING_CUE =
  /\b(?:onboard|end[\s-]to[\s-]end|from\s+scratch|full\s+setup|provider\s+onboarding|get\s+.+\s+ready|new\s+hire|set\s+up\s+new|setup\s+new)\b/i;

function hasCreateStepCue(prompt: string): boolean {
  return /\b(?:create|add|hire|register|onboard)\b/i.test(prompt);
}

function hasAssignStepCue(prompt: string): boolean {
  return /\bassign\b/i.test(prompt);
}

const SCHEDULE_STEP_CUE =
  /\b(?:first\s+week|weekday\s+template|onboard\s+schedule|set\s+up\s+.+\s+(?:week|schedule)|schedule\s+first\s+week)\b/i;

const BOOKING_STEP_CUE =
  /\b(?:online\s+booking|public\s+booking|enable\s+booking|booking\s+page|booking\s+website|turn\s+on\s+booking)\b/i;

export function extractAssignServiceNamesFromPrompt(
  prompt: string,
): string[] | undefined {
  const fromWith = extractServiceNamesFromPrompt(prompt);
  if (fromWith?.length) return fromWith;

  const assignMatch = prompt.match(
    /\bassign\s+([\w\s,and&'-]+?)\s+services?\b/i,
  );
  if (assignMatch?.[1]) {
    return assignMatch[1]
      .split(/\s+and\s+|,\s*/i)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  const skillsMatch = prompt.match(
    /\bwith\s+([\w\s,and&'-]+?)\s+(?:skills?|services?)\b/i,
  );
  if (skillsMatch?.[1]) {
    return skillsMatch[1]
      .split(/\s+and\s+|,\s*/i)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return undefined;
}

const INVALID_ONBOARDING_NAME = new Set([
  'employee',
  'provider',
  'new',
  'ing',
  'schedule',
  'team',
  'member',
  'hire',
  'setup',
  'full',
  'template',
  'weekday',
  'week',
  'first',
]);

export function extractOnboardingEmployeeNameFromPrompt(
  prompt: string,
): string | null {
  const roleName = prompt.match(
    /\b(?:stylist|therapist|barber|provider|specialist|esthetician|colorist|color\s+specialist|nail\s+tech|massage\s+therapist|team\s+member)\s+([A-Z][a-z]+)\b/,
  );
  if (roleName?.[1]) return roleName[1];

  const endToEndFor = prompt.match(
    /\bend-to-end\s+(?:for\s+|для\s+)?([A-Z][a-z]+)\b/i,
  );
  if (endToEndFor?.[1]) return endToEndFor[1];

  const armenianFor = prompt.match(/\b([A-Z][a-z]+)-ի\s+համար\b/u);
  if (armenianFor?.[1]) return armenianFor[1];

  const russianFor = prompt.match(/\bдля\s+([A-Z][a-z]+)\b/u);
  if (russianFor?.[1]) return russianFor[1];

  const setupFor = prompt.match(
    /\b(?:setup|set\s+up)\s+for\s+(?:new\s+)?(?:[\w\s]+\s+)?([A-Z][a-z]+)\b/i,
  );
  if (
    setupFor?.[1] &&
    !INVALID_ONBOARDING_NAME.has(setupFor[1].toLowerCase())
  ) {
    return setupFor[1];
  }

  const readyName = prompt.match(
    /\b(?:get|make)\s+new\s+[\w\s]+\s+([A-Z][a-z]+)\s+ready\b/i,
  );
  if (readyName?.[1]) return readyName[1];

  const forName = prompt.match(/\bfor\s+([A-Z][a-z]+)\b/);
  if (forName?.[1] && !INVALID_ONBOARDING_NAME.has(forName[1].toLowerCase())) {
    return forName[1];
  }

  const fromStaff = extractEmployeeNameFromPrompt(prompt);
  if (fromStaff && !INVALID_ONBOARDING_NAME.has(fromStaff.toLowerCase())) {
    return fromStaff;
  }

  return null;
}

export function extractOnboardingTemplateName(
  prompt: string,
): string | undefined {
  if (/\bweekday\s+template\b/i.test(prompt)) return 'weekday';
  const fromNamed = prompt.match(/\bfrom\s+([\w\s]+?)\s+template\b/i);
  if (fromNamed?.[1]?.trim()) return fromNamed[1].trim();
  const named = prompt.match(/\bapply\s+([\w\s]+?)\s+template\b/i);
  if (named?.[1]?.trim()) return named[1].trim();
  return undefined;
}

function countOnboardingStepFamilies(prompt: string): number {
  let count = 0;
  if (
    (hasCreateStepCue(prompt) || isCreateEmployeePrompt(prompt)) &&
    PROVIDER_ROLE.test(prompt)
  ) {
    count += 1;
  }
  if (hasAssignStepCue(prompt) && /\b(?:service|skill)/i.test(prompt)) {
    count += 1;
  }
  if (SCHEDULE_STEP_CUE.test(prompt) || isOnboardProviderPrompt(prompt)) {
    count += 1;
  }
  if (BOOKING_STEP_CUE.test(prompt)) count += 1;
  return count;
}

export function isProviderOnboardingCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (text.length < 28) return false;

  const hasFullCue =
    FULL_ONBOARDING_CUE.test(text) ||
    (/\b(?:set\s+up|setup)\b/i.test(text) && PROVIDER_ROLE.test(text));

  if (!hasFullCue) return false;

  const stepFamilies = countOnboardingStepFamilies(text);
  const fullSetup =
    /\b(?:end[\s-]to[\s-]end|from\s+scratch|full\s+setup)\b/i.test(text);
  if (stepFamilies < 2) return false;
  if (!fullSetup && stepFamilies < 3) return false;

  return (
    fullSetup ||
    stepFamilies >= 3 ||
    PROVIDER_ONBOARDING_COMPOUND_MARKERS.test(text) ||
    /;\s*/.test(text)
  );
}

export type ProviderOnboardingCompoundStep = {
  action: ProviderOnboardingCompoundStepAction;
  params: Record<string, unknown>;
  segment: string;
};

export function buildProviderOnboardingCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const params = enrichParamsWithSharedEntities({}, prompt);
  const employeeName = extractOnboardingEmployeeNameFromPrompt(prompt);
  if (employeeName) params.employeeName = employeeName;

  const serviceNames = extractAssignServiceNamesFromPrompt(prompt);
  if (serviceNames?.length) params.serviceNames = serviceNames;

  const templateName = extractOnboardingTemplateName(prompt);
  if (templateName) params.templateName = templateName;

  if (/\bfirst\s+week\b/i.test(prompt)) {
    params.dateRange = 'first_week';
  }

  const enabled = parseOnlineBookingEnabledFromPrompt(prompt);
  if (enabled !== null) {
    params.enabled = enabled;
  } else if (BOOKING_STEP_CUE.test(prompt)) {
    params.enabled = true;
  }

  return params;
}

export function decomposeProviderOnboardingCompoundPrompt(
  prompt: string,
): ProviderOnboardingCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isProviderOnboardingCompoundPrompt(trimmed)) return [];

  const base = buildProviderOnboardingCompoundParams(trimmed);
  const steps: ProviderOnboardingCompoundStep[] = [
    {
      action: 'create_employee',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'assign_employee_services',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'onboard_provider_schedule',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'configure_online_booking',
      params: { ...base },
      segment: trimmed,
    },
  ];

  return propagateCompoundStepParamsAcrossSteps(steps);
}
