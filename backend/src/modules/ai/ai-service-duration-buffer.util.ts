import { resolveServices } from './ai-orchestration.helpers.js';
import type { Service } from '../service/entities/service.entity.js';

/** Dashboard mutate intent (ai-cmd-ext-2.17). */
export const UPDATE_SERVICE_DURATION_BUFFER_INTENT =
  'update_service_duration_buffer' as const;

export type ServiceDurationBufferAccessTier = 'M';

export function resolveServiceDurationBufferAccessTier(
  action: string,
): ServiceDurationBufferAccessTier | null {
  return action === UPDATE_SERVICE_DURATION_BUFFER_INTENT ? 'M' : null;
}

export const SERVICE_DURATION_BUFFER_CLASSIFIER_RULES = `- update_service_duration_buffer: MUTATE — bulk or scoped update of catalog service durationMinutes and/or bufferMinutes on the Services form. Scope: allServices for every service; categoryName for "massage services" / "services in Hair"; serviceName for one service; serviceNames[] for "Massage and Facial". Params: durationMinutes (number), bufferMinutes (number) — at least one required. NOT update_service (move to category only), NOT update_service_prices (price %), NOT create_service/create_services (new rows with price), NOT configure_tour_service (tour durationDays metadata), NOT configure_multi_service_settings (visit max duration limits).
- Examples:
  - "Set all massage services to 60 minutes with 15 min buffer" → categoryName=massage, durationMinutes=60, bufferMinutes=15
  - "Change Neck Massage duration to 45 minutes" → serviceName=Neck Massage, durationMinutes=45
  - "Set buffer to 10 minutes for all hair services" → categoryName=hair, bufferMinutes=10
  - "Set every service to 30 minutes" → allServices=true, durationMinutes=30`;

export type UpdateServiceDurationBufferPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof UPDATE_SERVICE_DURATION_BUFFER_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const UPDATE_SERVICE_DURATION_BUFFER_PROMPTS: UpdateServiceDurationBufferPromptFixture[] =
  [
    {
      id: 'category-duration-buffer',
      prompt: 'Set all massage services to 60 minutes with 15 min buffer',
      surface: 'dashboard',
      expectedAction: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
      paramsPartial: {
        categoryName: 'massage',
        durationMinutes: 60,
        bufferMinutes: 15,
      },
    },
    {
      id: 'single-service-duration',
      prompt: 'Change Neck Massage duration to 45 minutes',
      surface: 'dashboard',
      expectedAction: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
      paramsPartial: { serviceName: 'Neck Massage', durationMinutes: 45 },
    },
    {
      id: 'category-buffer-only',
      prompt: 'Set buffer to 10 minutes for all hair services',
      surface: 'dashboard',
      expectedAction: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
      paramsPartial: { categoryName: 'hair', bufferMinutes: 10 },
    },
    {
      id: 'named-services-both',
      prompt: 'Update Massage and Facial to 90 minutes with 20 min buffer',
      surface: 'dashboard',
      expectedAction: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
      paramsPartial: {
        serviceNames: ['Massage', 'Facial'],
        durationMinutes: 90,
        bufferMinutes: 20,
      },
    },
    {
      id: 'all-services-duration',
      prompt: 'Set every service to 30 minutes',
      surface: 'dashboard',
      expectedAction: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
      paramsPartial: { allServices: true, durationMinutes: 30 },
    },
    {
      id: 'category-duration-only',
      prompt: 'Adjust duration for color services to 75 minutes',
      surface: 'dashboard',
      expectedAction: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
      paramsPartial: { categoryName: 'color', durationMinutes: 75 },
    },
    {
      id: 'single-named-buffer',
      prompt: 'Set Blowdry service to 25 minutes with 5 minute buffer',
      surface: 'dashboard',
      expectedAction: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
      paramsPartial: {
        serviceName: 'Blowdry',
        durationMinutes: 25,
        bufferMinutes: 5,
      },
    },
    {
      id: 'category-in-name',
      prompt: 'Change all services in Hair category to 40 min duration',
      surface: 'dashboard',
      expectedAction: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
      paramsPartial: { categoryName: 'Hair', durationMinutes: 40 },
    },
    {
      id: 'single-buffer-only',
      prompt: 'Update buffer to 15 minutes for Massage service',
      surface: 'dashboard',
      expectedAction: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
      paramsPartial: { serviceName: 'Massage', bufferMinutes: 15 },
    },
    {
      id: 'category-min-suffix',
      prompt: 'Set all massage services duration to 60 min',
      surface: 'dashboard',
      expectedAction: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
      paramsPartial: { categoryName: 'massage', durationMinutes: 60 },
    },
    {
      id: 'plain-english-duration',
      prompt: 'Make Facial 50 minutes long with a 10 min buffer',
      surface: 'dashboard',
      expectedAction: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
      paramsPartial: {
        serviceName: 'Facial',
        durationMinutes: 50,
        bufferMinutes: 10,
      },
    },
    {
      id: 'category-em-dash-both',
      prompt:
        'Set duration and buffer for haircut services — 35 minutes and 5 min buffer',
      surface: 'dashboard',
      expectedAction: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
      paramsPartial: {
        categoryName: 'haircut',
        durationMinutes: 35,
        bufferMinutes: 5,
      },
    },
  ];

const DURATION_BUFFER_SIGNAL =
  /\b(duration|buffer|minutes?\s+long|min\s+buffer|minute\s+buffer)\b/i;

const MUTATE_DURATION_VERB = /\b(set|change|update|adjust|make|configure)\b/i;

const CREATE_SERVICE_SIGNAL =
  /\b(add|create|new)\s+(?:a\s+)?service\b|\$\s*\d|USD\s*\d|\d+\s*(?:m|min(?:ute)?s?)\s*\$\s*\d/i;

const TOUR_DURATION_DAYS = /\bduration\s+days?\b|\b(\d+)\s+day\s+tour\b/i;

const MULTI_SERVICE_MAX =
  /\bmax(?:imum)?\s+duration\b|\bmulti[\s-]?service\b.*\bmax\b/i;

const CATEGORY_MOVE = /\b(?:move|assign)\b.+\b(?:under|to)\b.+\bcategory\b/i;

function hasDurationOrBufferValue(prompt: string): boolean {
  return (
    /\b\d+\s*(?:m|min(?:ute)?s?)\b/i.test(prompt) ||
    /\b\d+\s*hour/i.test(prompt) ||
    /\bbuffer\b/i.test(prompt)
  );
}

export function isUpdateServiceDurationBufferPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (CREATE_SERVICE_SIGNAL.test(text)) return false;
  if (TOUR_DURATION_DAYS.test(text)) return false;
  if (MULTI_SERVICE_MAX.test(text)) return false;
  if (CATEGORY_MOVE.test(text)) return false;

  const hasServiceScope =
    /\b(?:all|every|each)\s+services?\b|\bservices?\s+in\b|\b(?:massage|hair|facial|dental|haircut|color)\s+services?\b|\bservice\b/i.test(
      text,
    );
  const hasMinutesValue = /\b\d+\s*(?:m|min(?:ute)?s?)\b/i.test(text);

  if (MUTATE_DURATION_VERB.test(text) && hasServiceScope && hasMinutesValue) {
    return true;
  }

  if (!DURATION_BUFFER_SIGNAL.test(text) && !/\bbuffer\b/i.test(text)) {
    return false;
  }
  if (!MUTATE_DURATION_VERB.test(text) && !/\bmake\b/i.test(text)) {
    return false;
  }
  return hasDurationOrBufferValue(text);
}

export type ParsedServiceDurationBufferConfig = {
  durationMinutes?: number;
  bufferMinutes?: number;
  allServices?: boolean;
  serviceName?: string;
  serviceNames?: string[];
  categoryName?: string;
};

function parseDurationMinutes(
  prompt: string,
  params: Record<string, unknown>,
): number | undefined {
  if (typeof params.durationMinutes === 'number') {
    return Math.max(10, params.durationMinutes);
  }
  const bufferOnly =
    /\bbuffer\b/i.test(prompt) &&
    !/\bduration\b/i.test(prompt) &&
    !/\b\d+\s*(?:m|min(?:ute)?s?)\s+with\b/i.test(prompt) &&
    !/\bto\s+\d+\s*(?:m|min(?:ute)?s?)\b/i.test(prompt);
  const hour = prompt.match(/\b(\d+(?:\.\d+)?)\s*hours?\b/i);
  if (hour) {
    return Math.max(10, Math.round(Number(hour[1]) * 60));
  }
  const durationTo = prompt.match(
    /\bduration\s+to\s+(\d{1,3})\s*(?:m|min(?:ute)?s?)\b/i,
  );
  if (durationTo) return Math.max(10, parseInt(durationTo[1], 10));
  const longMatch = prompt.match(/\b(\d{1,3})\s*(?:m|min(?:ute)?s?)\s+long\b/i);
  if (longMatch) return Math.max(10, parseInt(longMatch[1], 10));
  const toMinutes = prompt.match(/\bto\s+(\d{1,3})\s*(?:m|min(?:ute)?s?)\b/i);
  if (
    toMinutes &&
    (/\bduration\b/i.test(prompt) || /\bservices?\b/i.test(prompt))
  ) {
    return Math.max(10, parseInt(toMinutes[1], 10));
  }
  const emDash = prompt.match(/[—–-]\s*(\d{1,3})\s*(?:m|in(?:ute)?s?)\b/i);
  if (emDash && /\bduration\b/i.test(prompt)) {
    return Math.max(10, parseInt(emDash[1], 10));
  }
  if (bufferOnly) return undefined;
  const generic = prompt.match(/\b(\d{1,3})\s*(?:m|min(?:ute)?s?)\b/i);
  if (generic && !/\bbuffer\b/i.test(generic[0])) {
    return Math.max(10, parseInt(generic[1], 10));
  }
  return undefined;
}

function parseBufferMinutes(
  prompt: string,
  params: Record<string, unknown>,
): number | undefined {
  if (typeof params.bufferMinutes === 'number') {
    return Math.max(0, params.bufferMinutes);
  }
  const bufferTo = prompt.match(
    /\bbuffer\s+to\s+(\d{1,3})\s*(?:m|min(?:ute)?s?)\b/i,
  );
  if (bufferTo) return Math.max(0, parseInt(bufferTo[1], 10));
  const withBuffer = prompt.match(
    /\bwith\s+(?:a\s+)?(\d{1,3})\s*(?:m|min(?:ute)?s?)\s+buffer\b/i,
  );
  if (withBuffer) return Math.max(0, parseInt(withBuffer[1], 10));
  const minBuffer = prompt.match(
    /\b(\d{1,3})\s*(?:m|min(?:ute)?s?)\s+buffer\b/i,
  );
  if (minBuffer) return Math.max(0, parseInt(minBuffer[1], 10));
  const andBuffer = prompt.match(
    /\band\s+(\d{1,3})\s*(?:m|min(?:ute)?s?)\s+buffer\b/i,
  );
  if (andBuffer) return Math.max(0, parseInt(andBuffer[1], 10));
  return undefined;
}

function parseServiceScopeFromPrompt(prompt: string): {
  allServices?: boolean;
  serviceName?: string;
  serviceNames?: string[];
  categoryName?: string;
} {
  const categoryIn = prompt.match(
    /\bservices?\s+in\s+(?:the\s+)?([A-Za-z][\w&'-]+)\s+category\b/i,
  );
  if (categoryIn) return { categoryName: categoryIn[1].trim() };

  if (/\b(?:all|every|each)\s+services?\b/i.test(prompt)) {
    return { allServices: true };
  }

  const categoryServices = prompt.match(
    /\b(?:all|every)\s+([A-Za-z][\w&'-]+)\s+services?\b/i,
  );
  if (categoryServices) {
    return { categoryName: categoryServices[1].trim() };
  }

  const forService = prompt.match(
    /\bfor\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+service\b/i,
  );
  if (forService) return { serviceName: forService[1].trim() };

  const forCategory = prompt.match(
    /\bfor\s+all\s+([A-Za-z][\w&'-]+)\s+services\b/i,
  );
  if (forCategory) return { categoryName: forCategory[1].trim() };

  const forScopedCategory = prompt.match(
    /\bfor\s+([A-Za-z][\w&'-]+)\s+services\b/i,
  );
  if (forScopedCategory) return { categoryName: forScopedCategory[1].trim() };

  const namedPair = prompt.match(
    /\b(?:update|set|change|make)\s+([A-Za-z][\w\s'-]+?)\s+and\s+([A-Za-z][\w\s'-]+?)\s+to\b/i,
  );
  if (namedPair) {
    return {
      serviceNames: [namedPair[1].trim(), namedPair[2].trim()],
    };
  }

  const makeNamed = prompt.match(
    /\bmake\s+([A-Za-z][\w\s'-]+?)\s+\d+\s*(?:m|min(?:ute)?s?)\b/i,
  );
  if (makeNamed) return { serviceName: makeNamed[1].trim() };

  const changeNamed = prompt.match(
    /\bchange\s+([A-Za-z][\w\s'-]+?)\s+duration\b/i,
  );
  if (changeNamed) return { serviceName: changeNamed[1].trim() };

  const setNamed = prompt.match(
    /\bset\s+([A-Za-z][\w\s'-]+?)\s+service\s+to\b/i,
  );
  if (setNamed) return { serviceName: setNamed[1].trim() };

  return {};
}

export function parseUpdateServiceDurationBufferFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedServiceDurationBufferConfig | null {
  const hasExplicitParams =
    typeof params.durationMinutes === 'number' ||
    typeof params.bufferMinutes === 'number' ||
    params.allServices === true ||
    typeof params.serviceName === 'string' ||
    (Array.isArray(params.serviceNames) && params.serviceNames.length > 0) ||
    typeof params.categoryName === 'string';

  if (!isUpdateServiceDurationBufferPrompt(prompt) && !hasExplicitParams) {
    return null;
  }

  const durationMinutes = parseDurationMinutes(prompt, params);
  const bufferMinutes = parseBufferMinutes(prompt, params);
  if (durationMinutes === undefined && bufferMinutes === undefined) {
    return null;
  }

  const scopeFromPrompt = parseServiceScopeFromPrompt(prompt);
  const allServices =
    params.allServices === true || scopeFromPrompt.allServices === true;
  const serviceName =
    (typeof params.serviceName === 'string' && params.serviceName) ||
    scopeFromPrompt.serviceName;
  const serviceNames =
    (Array.isArray(params.serviceNames) &&
      params.serviceNames.filter((n): n is string => typeof n === 'string')) ||
    scopeFromPrompt.serviceNames;
  const categoryName =
    (typeof params.categoryName === 'string' && params.categoryName) ||
    scopeFromPrompt.categoryName;

  return {
    ...(durationMinutes !== undefined ? { durationMinutes } : {}),
    ...(bufferMinutes !== undefined ? { bufferMinutes } : {}),
    allServices,
    serviceName: serviceName || undefined,
    serviceNames: serviceNames?.length ? serviceNames : undefined,
    categoryName: categoryName || undefined,
  };
}

export function resolveTargetServicesForDurationBuffer<
  T extends {
    id: string;
    name: string;
    isActive?: boolean;
    category?: { name: string } | null;
  },
>(catalog: T[], config: ParsedServiceDurationBufferConfig): T[] {
  const active = catalog.filter((s) => s.isActive !== false);
  if (config.allServices) return active;

  if (config.serviceNames?.length) {
    const matched = resolveServices(active as unknown as Service[], {
      serviceNames: config.serviceNames,
    });
    if (matched.length) return matched as unknown as T[];
  }

  if (config.serviceName) {
    const matched = resolveServices(active as unknown as Service[], {
      serviceName: config.serviceName,
    });
    if (matched.length) return matched as unknown as T[];
  }

  if (config.categoryName) {
    const hint = config.categoryName.toLowerCase().trim();
    const matched = active.filter(
      (s) =>
        s.category?.name?.toLowerCase().includes(hint) ||
        s.name.toLowerCase().includes(hint),
    );
    if (matched.length) return matched;
  }

  return [];
}

export function rescueUpdateServiceDurationBufferIntent(
  prompt: string,
  action: string,
): {
  action: typeof UPDATE_SERVICE_DURATION_BUFFER_INTENT;
  rescueReason: string;
} | null {
  if (action === UPDATE_SERVICE_DURATION_BUFFER_INTENT) return null;
  if (!isUpdateServiceDurationBufferPrompt(prompt)) return null;
  return {
    action: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
    rescueReason: UPDATE_SERVICE_DURATION_BUFFER_INTENT,
  };
}

export function enrichServiceDurationBufferParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseUpdateServiceDurationBufferFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    ...(parsed.durationMinutes !== undefined
      ? { durationMinutes: parsed.durationMinutes }
      : {}),
    ...(parsed.bufferMinutes !== undefined
      ? { bufferMinutes: parsed.bufferMinutes }
      : {}),
    allServices: parsed.allServices || params.allServices,
    serviceName: parsed.serviceName ?? params.serviceName,
    serviceNames: parsed.serviceNames ?? params.serviceNames,
    categoryName: parsed.categoryName ?? params.categoryName,
  };
}
