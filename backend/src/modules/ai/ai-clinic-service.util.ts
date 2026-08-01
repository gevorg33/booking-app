import {
  isClinicServiceType,
  type ClinicServiceType,
} from '../../common/utils/clinic-service.util.js';
import {
  isCreateTestOrderPrompt,
  isListTestOrdersPrompt,
} from './ai-clinic-test-order.util.js';
import { isExplainClinicBookingPrompt } from './ai-clinic-booking.util.js';

export const CLINIC_SERVICE_INTENTS = [
  'configure_clinic_service',
  'explain_clinic_services',
  'apply_clinic_playbook',
] as const;

export const CLINIC_SERVICE_MUTATE_INTENTS = [
  'configure_clinic_service',
  'apply_clinic_playbook',
] as const;

export const CLINIC_SERVICE_READ_INTENTS = ['explain_clinic_services'] as const;

export type ClinicServiceIntent = (typeof CLINIC_SERVICE_INTENTS)[number];

export interface ParsedConfigureClinicService {
  serviceName?: string;
  serviceId?: string;
  serviceType?: ClinicServiceType;
  requiresFasting?: boolean;
  preparationNotes?: string;
}

export interface ParsedExplainClinicServices {
  serviceName?: string;
  serviceId?: string;
}

const SERVICE_TYPE_ALIASES: Record<string, ClinicServiceType> = {
  consultation: 'consultation',
  consult: 'consultation',
  visit: 'consultation',
  lab_test: 'lab_test',
  lab: 'lab_test',
  'lab test': 'lab_test',
  laboratory: 'lab_test',
  blood: 'lab_test',
  procedure: 'procedure',
  diagnostic: 'procedure',
  imaging: 'procedure',
  'лабораторный тест': 'lab_test',
  лабораторный: 'lab_test',
  консультация: 'consultation',
  консультацией: 'consultation',
  процедура: 'procedure',
  процедурой: 'procedure',
  'լաբ թեստ': 'lab_test',
  լաբորատոր: 'lab_test',
  խորհրդատվություն: 'consultation',
  ընթացակարգ: 'procedure',
};

function hasClinicConfigureSurface(prompt: string): boolean {
  return (
    /\b(lab\s+test|consultation|procedure|fasting|fast\s+for|prep(?:aration)?\s+instructions?|preparation\s+notes?|NPO|service\s+type|clinic\s+metadata)\b/i.test(
      prompt,
    ) ||
    /\bas\s+a\s+(?:lab|consultation|procedure)\b/i.test(prompt) ||
    /(լաբ\s*թեստ|խորհրդատվություն|ընթացակարգ|ծոմավոր|նախապատրաստ)/i.test(
      prompt,
    ) ||
    /(лабораторн|консультац|процедур|голод|подготов|натощак)/i.test(prompt)
  );
}

function isMutateClinicConfigurePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    /^(?:отметь|сделай|установи|измени|настрой|убери)\b/iu.test(prompt.trim())
  ) {
    return true;
  }
  return (
    /\b(set|mark|enable|make|turn|update|change|configure|put|assign|add|remove|clear)\b/i.test(
      prompt,
    ) ||
    /(նշ|սահման|դարձր|փոխ|ակտիվացր|թարմացր|թարմացն|հանի)/i.test(lower) ||
    /(установ|отмет|включ|сделай|измен|обнов|задай|настрой|убери)/i.test(lower)
  );
}

function hasReadClinicCue(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(what|which|how\s+many|show|list|explain|summarize|tell|display|overview|describe|breakdown|count)\b/i.test(
      prompt,
    ) ||
    /\?\s*$/.test(prompt.trim()) ||
    // e2e-bug.291 — bare `որ` matched inside `կատեգորիա` and stole catalog creates.
    // Keep stem prefixes for conjugated forms (Բացատրի՛ր / ցուցադրիր).
    /(?:^|[^\p{L}\p{M}])(?:ինչ(?:պե՞ս|պես)?|քանի|ցույց|բացատր|ցուցադր|քանակ)/iu.test(
      prompt,
    ) ||
    /(?:^|[^\p{L}\p{M}])որ(?:քան)?(?=[^\p{L}\p{M}]|$)/iu.test(prompt) ||
    /(какие|какой|сколько|покажи|объясни|список|сколько)/i.test(lower)
  );
}

/** e2e-bug.291 — create catalog category must not rescue to explain_clinic_services. */
function looksLikeCreateCatalogCategoryPrompt(prompt: string): boolean {
  return (
    /\b(add|create)\s+(a\s+)?(new\s+)?((?:service|catalog)\s+)?category\b/i.test(
      prompt,
    ) ||
    /(?:ավելացր(?:ու|ել|եք)?|ստեղծ(?:իր|ել|եք)?)\s+[\s\S]*կատեգորիա/iu.test(
      prompt,
    ) ||
    /կատեգորիա\s+անունով/iu.test(prompt) ||
    // e2e-bug.292 — RU single catalog-category create.
    /(?:добав|созда)[\p{L}\p{M}]*.*категор/iu.test(prompt)
  );
}

function hasClinicExplainSurface(prompt: string): boolean {
  if (
    /\b(which|what)\s+(?:lab\s+tests?|services?).*(?:fasting|prep)\b/i.test(
      prompt,
    ) ||
    /\bfasting\s+requirements?\b/i.test(prompt) ||
    /(?:ինչ|որ)\s+(?:լաբ|ծառայ)[\p{L}\p{M}]*.*ծոմավոր/iu.test(prompt) ||
    /(?:какие|какой|который)\s+(?:лабораторн[\p{L}\p{M}]*\s+)?(?:тест[\p{L}\p{M}]*|услуг[\p{L}\p{M}]*).*голод/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  return (
    /\b(clinic\s+services?|clinic\s+catalog|departments?|service\s+types?|consultation\s+vs|lab\s+tests?\s+vs|fasting\s+requirements?)\b/i.test(
      prompt,
    ) ||
    /\b(?:our\s+)?(?:clinic|polyclinic)\b/i.test(prompt) ||
    /(կլինիկական\s+ծառայություն|բաժին|խորհրդատվություն|կատալոգ)/i.test(
      prompt,
    ) ||
    /(клиник|поликлиник|отделен|каталог\s+клиник|лабораторн|консультац)/i.test(
      prompt,
    )
  );
}

function isBulkPricePrompt(prompt: string): boolean {
  return (
    /\b(price|prices|percent|%|raise|lower|increase|decrease)\b/i.test(
      prompt,
    ) && /\b(all|every|category|catalog)\b/i.test(prompt)
  );
}

function isCreateNewServicePrompt(prompt: string): boolean {
  return (
    /\b(add|create|new)\s+(?:a\s+)?(?:clinic\s+)?service\b/i.test(prompt) &&
    !/\bfor\s+(?:the\s+)?[A-Za-z]/i.test(prompt)
  );
}

function isGenericCatalogOrSchedulePrompt(prompt: string): boolean {
  return (
    /\bbulk\s+create\b/i.test(prompt) ||
    /\bcreate\s+category\b/i.test(prompt) ||
    (/\bapply\s+schedule\b/i.test(prompt) &&
      /\b(employee|provider|staff|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(
        prompt,
      ))
  );
}

function isClinicOrderOrResultPrompt(prompt: string): boolean {
  return (
    isCreateTestOrderPrompt(prompt) ||
    /\b(enter|release|push)\s+(?:test\s+)?result\b/i.test(prompt) ||
    /\b(test\s+order|lab\s+order|specimen|collection\s+queue)\b/i.test(prompt)
  );
}

function isConsumerCheckoutContext(prompt: string): boolean {
  const hasCheckoutContext =
    /\b(checkout|booking\s+page|when\s+i\s+book|consumer\s+app|this\s+page|appointment\s+page)\b/i.test(
      prompt,
    ) ||
    /(checkout|գրանցման\s+էջ|այս\s+էջ|страниц[аеы]\s+записи)/i.test(prompt);

  if (hasCheckoutContext && isExplainClinicBookingPrompt(prompt)) {
    return true;
  }

  return hasCheckoutContext;
}

const APPLY_CLINIC_PLAYBOOK_VERB =
  /\b(apply|set\s+up|load|seed|run|use|install)\b/i;

function isApplyClinicPlaybookPromptCore(prompt: string): boolean {
  if (/\bapply\s+clinic\s+playbook\b/i.test(prompt)) return true;
  if (/կիրառ(?:ի՛ր|ել)\s+կլինիկայի\s+playbook/i.test(prompt)) return true;
  if (/примени\s+clinic\s+playbook/i.test(prompt)) return true;

  if (
    /\b(clinic\s+playbook|clinic\s+vertical\s+playbook|vertical\s+clinic\s+playbook|polyclinic\s+playbook|polyclinic\s+starter)\b/i.test(
      prompt,
    ) &&
    APPLY_CLINIC_PLAYBOOK_VERB.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(clinic|polyclinic|beauty\s+clinic|dental)\b/i.test(prompt) &&
    /\b(playbook|starter|catalog|schedule|operating\s+hours|services?)\b/i.test(
      prompt,
    ) &&
    APPLY_CLINIC_PLAYBOOK_VERB.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(seed|load)\s+(?:starter\s+)?clinic\b/i.test(prompt) &&
    /\b(catalog|services?|schedule|operating\s+hours)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\bclinic\s+business\b/i.test(prompt) &&
    /\bclinic\s+playbook\b/i.test(prompt) &&
    APPLY_CLINIC_PLAYBOOK_VERB.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function isApplyClinicPlaybookPrompt(prompt: string): boolean {
  if (isGenericCatalogOrSchedulePrompt(prompt)) return false;
  return isApplyClinicPlaybookPromptCore(prompt);
}

function isConfigureClinicServicePromptCore(prompt: string): boolean {
  if (isBulkPricePrompt(prompt)) return false;
  if (isCreateNewServicePrompt(prompt)) return false;
  if (isApplyClinicPlaybookPromptCore(prompt)) return false;
  if (isClinicOrderOrResultPrompt(prompt)) return false;
  if (isConsumerCheckoutContext(prompt)) return false;
  if (!hasClinicConfigureSurface(prompt)) return false;
  if (!isMutateClinicConfigurePrompt(prompt)) return false;
  return true;
}

export function isConfigureClinicServicePrompt(prompt: string): boolean {
  return (
    isConfigureClinicServicePromptCore(prompt) &&
    !isExplainClinicServicesPrompt(prompt)
  );
}

export function isExplainClinicServicesPrompt(prompt: string): boolean {
  if (isListTestOrdersPrompt(prompt)) return false;
  if (isConfigureClinicServicePromptCore(prompt)) return false;
  if (isApplyClinicPlaybookPromptCore(prompt)) return false;
  if (isClinicOrderOrResultPrompt(prompt)) return false;
  if (isConsumerCheckoutContext(prompt)) return false;
  // e2e-bug.291 — HY/EN "add catalog category named…" is not a clinic catalog read.
  if (looksLikeCreateCatalogCategoryPrompt(prompt)) return false;
  if (!hasClinicExplainSurface(prompt)) return false;
  if (!hasReadClinicCue(prompt)) return false;
  return true;
}

function normalizeServiceType(
  value: string | undefined,
): ClinicServiceType | undefined {
  if (!value) return undefined;
  const key = value.trim().toLowerCase().replace(/\s+/g, ' ');
  const mapped = SERVICE_TYPE_ALIASES[key];
  return mapped && isClinicServiceType(mapped) ? mapped : undefined;
}

function extractServiceType(prompt: string): ClinicServiceType | undefined {
  const patterns = [
    /\bmake\s+.+\s+a\s+(lab\s+test|consultation|procedure)\b/i,
    /\bas\s+a\s+(lab\s+test|consultation|procedure)\b/i,
    /\bmark\s+.+\s+as\s+(?:a\s+)?(lab\s+test|consultation|procedure)\b/i,
    /\bset\s+.+\s+as\s+(?:a\s+)?(lab\s+test|consultation|procedure)\b/i,
    /\bconfigure\s+.+\s+as\s+(?:a\s+)?(lab\s+test|consultation|procedure)\b/i,
    /\bmake\s+.+\s+a\s+(lab\s+test|consultation|procedure)\b/i,
    /\b(lab\s+test|consultation|procedure)\s+service\b/i,
    /(?:как|сделай)\s+(lab\s+test|consultation|procedure|лабораторн[\p{L}\p{M}]*\s+тест[\p{L}\p{M}]*|консультац[\p{L}\p{M}]*|процедур[\p{L}\p{M}]*)/iu,
    /(?:որպես|դարձր(?:ու|ել)?)\s+(lab\s+test|consultation|procedure|լաբ\s*թեստ|խորհրդատվություն|ընթացակարգ)/iu,
    /(?:как|отметь)\s+.+\s+(лабораторн[\p{L}\p{M}]*\s+тест[\p{L}\p{M}]*|консультац[\p{L}\p{M}]*|процедур[\p{L}\p{M}]*)/iu,
    /\bкак\s+(лабораторн[\p{L}\p{M}]*\s+тест[\p{L}\p{M}]*|консультац[\p{L}\p{M}]*|процедур[\p{L}\p{M}]*)\b/iu,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const serviceType = normalizeServiceType(match?.[1]);
    if (serviceType) return serviceType;
  }
  if (
    /\blab\s+test\b/i.test(prompt) &&
    isConfigureClinicServicePromptCore(prompt)
  ) {
    return 'lab_test';
  }
  if (
    /(?:լաբ\s*թեստ|лабораторн[\p{L}\p{M}]*\s+тест)/iu.test(prompt) &&
    isConfigureClinicServicePromptCore(prompt)
  ) {
    return 'lab_test';
  }
  if (
    /\bconsultation\b/i.test(prompt) &&
    isConfigureClinicServicePromptCore(prompt)
  ) {
    return 'consultation';
  }
  if (
    /\bprocedure\b/i.test(prompt) &&
    isConfigureClinicServicePromptCore(prompt)
  ) {
    return 'procedure';
  }
  if (
    /(?:խորհրդատվություն|консультац)/iu.test(prompt) &&
    isConfigureClinicServicePromptCore(prompt)
  ) {
    return 'consultation';
  }
  return undefined;
}

function extractRequiresFasting(prompt: string): boolean | undefined {
  if (
    /\b(no\s+fasting|without\s+fasting|remove\s+fasting|not\s+requiring\s+fasting|does\s+not\s+require\s+fasting)\b/i.test(
      prompt,
    ) ||
    /(առանց\s+ծոմավոր|հան(?:ի՛ր|ել)?\s+ծոմավոր)/i.test(prompt) ||
    /(без\s+голод|убери\s+голод)/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(requiring\s+fasting|requires\s+fasting|with\s+fasting|fasting\s+required|require\s+fasting)\b/i.test(
      prompt,
    ) ||
    /(?:натощак|голод)/i.test(prompt) ||
    /\bfast(?:ing)?\b/i.test(prompt) ||
    /(ծոմավոր)/i.test(prompt)
  ) {
    return true;
  }
  return undefined;
}

function extractPreparationNotes(prompt: string): string | undefined {
  const patterns = [
    /\bupdate\s+preparation\s+notes?\s+for\s+[\w\s'-]+?\s+to\s+(.+?)(?:\s*$|\.)/i,
    /\bprep(?:aration)?\s+instructions?\s+for\s+[\w\s'-]+?\s+to\s+(.+?)(?:\s*$|\.)/i,
    /\bset\s+[\w\s'-]+?\s+prep\s+instructions?\s+to\s+(.+?)(?:\s*$|\.)/i,
    /նախապատրաստ(?:ման)?\s+(?:ի\s+)?կետ(?:երը)?[^՝]*՝\s*(.+?)(?:\s*$|\.)/i,
    /подготов(?:ка|ку)\s+[^.]+\s+(?:на|к|—)\s+(.+?)(?:\s*$|\.)/i,
    /инструкции\s+подготовки\s+[^.]+\s+—\s+(.+?)(?:\s*$|\.)/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const notes = match?.[1]?.trim();
    if (notes && notes.length >= 3) return notes;
  }
  return undefined;
}

function normalizeServiceNameCandidate(candidate: string): string | null {
  let name = candidate.trim();
  for (let i = 0; i < 4; i += 1) {
    const next = name
      .replace(
        /^(?:mark|set|make|turn|update|change|enable|configure|put|remove)\s+(?:the\s+)?/i,
        '',
      )
      .replace(/^(?:the|a|an)\s+/i, '')
      .trim();
    if (next === name) break;
    name = next;
  }
  name = name
    .replace(/\s+as\s+a\s+(?:lab\s+test|consultation|procedure)\b[\s\S]*$/i, '')
    .replace(/\s+requiring\s+fasting\b[\s\S]*$/i, '')
    .replace(/\s+prep\s+instructions?\b[\s\S]*$/i, '')
    .replace(/-ը$/i, '')
    .replace(/-ն$/i, '')
    .replace(/-ի$/i, '')
    .trim();
  return name.length >= 2 ? name : null;
}

function extractServiceNameFromPrompt(prompt: string): string | null {
  const quoted = prompt.match(/["']([^"']{2,80})["']/);
  if (quoted?.[1]) return quoted[1].trim();

  const patterns = [
    /\bprep(?:aration)?\s+instructions?\s+for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+to\b/i,
    /\bpreparation\s+notes?\s+for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+to\b/i,
    /\b(?:set|update)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+prep\s+instructions?\s+to\b/i,
    /\b(?:mark|set|configure|make|update)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+(?:as\s+)?a\s+(?:lab\s+test|consultation|procedure)\b/i,
    /\b(?:mark|set|configure|make|update)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+as\b/i,
    /\b(?:mark|set|configure|make|update)\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+(?:as\s+a\s+)?(?:lab\s+test|consultation|procedure)\b/i,
    /\b(?:remove|clear)\s+fasting\s+(?:requirement\s+)?for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)(?:\s*$|\.)/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)(?:\s*$|\.)/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)-ը\s+(?:որպես|լաբ)/i,
    /([A-Za-z0-9][\w\s&'-]+?)-(?:ն|ը)\s+(?:որպես|լաբ|խորհրդ|консульт)/iu,
    /([A-Za-z0-9][\w\s&'-]+?)-(?:ից|ի)(?=\s|$|[,.])/iu,
    /\b([A-Za-z0-9][\w\s&'-]+?)-(?:ից|ի)\b/i,
    /(?:отметь|сделай|установи)\s+([A-Za-z0-9][\w\s&'-]+?)\s+как(?=[\s,.;!?]|$)/iu,
    /(?:сделай|отметь|установи)\s+([A-Za-z0-9][\w\s&'-]+(?:\s+[A-Za-z0-9][\w\s&'-]+)?)\s+(?:консультац|лабораторн)/iu,
    /\b([A-Za-z0-9][\w\s&'-]+?)-ի\s+համար/i,
    /для\s+([A-Za-z0-9][\w\s&'-]+?)(?:\s*—|\s*$|\.)/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = normalizeServiceNameCandidate(match?.[1] ?? '');
    if (candidate) return candidate;
  }

  return null;
}

function extractExplainServiceFilter(prompt: string): string | null {
  const patterns = [
    /\bsettings\s+for\s+([A-Za-z0-9][\w\s&'-]+)\s*$/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+)\s+settings\b/i,
    /\bexplain\s+clinic\s+settings\s+for\s+([A-Za-z0-9][\w\s&'-]+)\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = normalizeServiceNameCandidate(match?.[1] ?? '');
    if (candidate) return candidate;
  }
  return null;
}

function hasClinicFieldPatch(parsed: ParsedConfigureClinicService): boolean {
  return (
    parsed.serviceType !== undefined ||
    parsed.requiresFasting !== undefined ||
    parsed.preparationNotes !== undefined
  );
}

export function parseConfigureClinicServiceFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigureClinicService | null {
  if (!isConfigureClinicServicePrompt(prompt)) return null;

  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const serviceNameFromParams =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const serviceName =
    serviceNameFromParams || extractServiceNameFromPrompt(prompt) || undefined;

  const serviceTypeFromParams = normalizeServiceType(
    typeof params.serviceType === 'string' ? params.serviceType : undefined,
  );
  const serviceType = serviceTypeFromParams ?? extractServiceType(prompt);

  const requiresFastingFromParams =
    params.requiresFasting === true
      ? true
      : params.requiresFasting === false
        ? false
        : undefined;
  const requiresFasting =
    requiresFastingFromParams ?? extractRequiresFasting(prompt);

  const preparationNotes =
    (typeof params.preparationNotes === 'string'
      ? params.preparationNotes.trim()
      : undefined) ?? extractPreparationNotes(prompt);

  if (!serviceId && !serviceName) return null;

  const parsed: ParsedConfigureClinicService = {
    serviceId,
    serviceName,
    ...(serviceType ? { serviceType } : {}),
    ...(requiresFasting !== undefined ? { requiresFasting } : {}),
    ...(preparationNotes ? { preparationNotes } : {}),
  };

  if (!hasClinicFieldPatch(parsed)) return null;

  return parsed;
}

export function parseExplainClinicServicesFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainClinicServices | null {
  if (!isExplainClinicServicesPrompt(prompt)) return null;

  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const serviceNameFromParams =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const serviceName =
    serviceNameFromParams || extractExplainServiceFilter(prompt) || undefined;

  return {
    serviceId,
    serviceName,
  };
}

export function parseApplyClinicPlaybookFromPrompt(
  prompt: string,
): Record<string, never> | null {
  if (!isApplyClinicPlaybookPrompt(prompt)) return null;
  return {};
}

export function rescueApplyClinicPlaybookIntent(
  prompt: string,
  action: string,
): { action: 'apply_clinic_playbook'; rescueReason: string } | null {
  if (action === 'apply_clinic_playbook') return null;
  if (!parseApplyClinicPlaybookFromPrompt(prompt)) return null;
  return {
    action: 'apply_clinic_playbook',
    rescueReason: 'apply_clinic_playbook',
  };
}

export function rescueConfigureClinicServiceIntent(
  prompt: string,
  action: string,
): { action: 'configure_clinic_service'; rescueReason: string } | null {
  if (
    action === 'configure_clinic_service' ||
    action === 'apply_clinic_playbook'
  ) {
    return null;
  }
  if (!parseConfigureClinicServiceFromPrompt(prompt)) return null;
  return {
    action: 'configure_clinic_service',
    rescueReason: 'configure_clinic_service',
  };
}

export function rescueExplainClinicServicesIntent(
  prompt: string,
  action: string,
): { action: 'explain_clinic_services'; rescueReason: string } | null {
  if (action === 'apply_clinic_playbook') return null;
  if (isApplyClinicPlaybookPrompt(prompt)) return null;
  if ((CLINIC_SERVICE_READ_INTENTS as readonly string[]).includes(action)) {
    return null;
  }
  if (!parseExplainClinicServicesFromPrompt(prompt)) return null;
  return {
    action: 'explain_clinic_services',
    rescueReason: 'explain_clinic_services',
  };
}
