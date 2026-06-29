import { isAssignCategoryToProviderPrompt } from './ai-category-assignment.util.js';

/** Dashboard staff lifecycle intents (ai-cmd-ext-2.5–2.8). */

export const STAFF_OPERATIONS_MUTATE_INTENTS = [
  'create_employee',
  'update_employee',
  'invite_staff_member',
  'deactivate_employee',
  'configure_online_booking',
] as const;

export const STAFF_OPERATIONS_INTENTS = [
  ...STAFF_OPERATIONS_MUTATE_INTENTS,
] as const;

export type StaffOperationsIntent = (typeof STAFF_OPERATIONS_INTENTS)[number];

export const STAFF_OPERATIONS_CLASSIFIER_RULES = `- create_employee: MUTATE — add a new provider/team member to the business. Requires employeeName (display name). Optional email, phone, serviceNames (catalog skills to assign on create). Use for "add stylist Anna", "create employee Maria with massage services". NOT invite_staff_member (sends app invite to existing email), NOT assign_employee_services alone (assigns to existing provider).
- update_employee: MUTATE — edit an existing team member's profile: rename, change email, phone, or job title. Requires employeeName (who to edit) plus at least one of newName, email, phone, title. Use for "rename Anna to Maria", "change Maria's email to m@salon.com", "update Jake's phone", "set Anna's title to Senior Stylist". NOT create_employee (new roster row), NOT deactivate_employee (removal), NOT assign_employee_services (skills), NOT update_service_prices (catalog prices).
- invite_staff_member: MUTATE — send dashboard or provider-app invitation email. Requires email OR employeeName of an existing employee without app access. Optional role (contributor/manager). Use for "invite Maria to the provider app", "send staff invite to anna@salon.com". NOT create_employee (creates roster row first).
- deactivate_employee: MUTATE — remove/deactivate a provider from active roster (soft delete). Requires employeeName. Use for "deactivate Gevorg", "remove Maria from the team". NOT cancel_bookings (cancels appointments), NOT block_schedule.
- configure_online_booking: MUTATE — toggle or explain public booking page settings (enable/disable online booking). Optional enabled boolean. Use for "enable online booking", "turn off public booking page", "configure our booking website". NOT create_direct_schedule (staff hours).`;

export const STAFF_OPERATIONS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian dashboard staff operations (ai-cmd-ext-2.5–2.8):
  - create_employee: hy «ավելացրու Anna որպես stylist», «ստեղծիր աշխատակից Maria massage services-ով»; ru «добавь Anna в команду», «создай сотрудника Maria с услугами massage». Requires employeeName. NOT invite_staff_member.
  - update_employee: hy «վերանվանիր Anna-ին Maria», «փոխիր Maria-ի email-ը m@salon.com», «թարմացրու Jake-ի հեռախոսը»; ru «переименуй Anna в Maria», «измени email Maria на m@salon.com», «обнови телефон Jake». Requires employeeName + a field. NOT create_employee, NOT deactivate_employee.
  - invite_staff_member: hy «հրավիր anna@salon.com provider app», «ուղարկիր հրավեր Maria-ին»; ru «пригласи anna@salon.com в приложение провайдера», «отправь приглашение Maria». Requires email or employeeName. NOT create_employee.
  - deactivate_employee: hy «ապաակտիվացրու Gevorg-ին», «հեռացրու Maria-ն թիմից»; ru «деактивируй Gevorg», «удали Maria из команды». Requires employeeName. NOT cancel_bookings.
  - configure_online_booking: hy «միացրու online booking public page-ում», «անջատիր public booking website-ը»; ru «включи онлайн-запись на публичной странице», «отключи публичную страницу записи». Optional enabled. NOT create_direct_schedule.`;

export function isStaffOperationsIntent(
  action: string,
): action is StaffOperationsIntent {
  return (STAFF_OPERATIONS_INTENTS as readonly string[]).includes(action);
}

function matchLocale(prompt: string, pattern: RegExp): boolean {
  return pattern.test(prompt) || pattern.test(prompt.toLowerCase());
}

export function isCreateEmployeePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    matchLocale(lower, /(?:ավելացր|ստեղծ|գրանց|ընդուն|տեսն|onboard|hire)/u) &&
    /(?:աշխատակից|provider|stylist|staff|team|therapist|specialist|barber|employee|roster|member)/iu.test(
      prompt,
    ) &&
    !matchLocale(lower, /(?:հրավիր|invite|ապաակտիվ|deactivate|remove|disable)/u)
  ) {
    return true;
  }
  if (
    matchLocale(lower, /(?:добав|созда|наним|зарегистр|прими|онборд)/u) &&
    /(?:сотрудник|provider|stylist|команд|специалист|specialist|персонал|barber|employee|roster|member|staff|color)/iu.test(
      prompt,
    ) &&
    !matchLocale(lower, /(?:приглас|invite|деактив|удал|отключ)/u)
  ) {
    return true;
  }
  return (
    /\b(?:create|add|hire|onboard|register)\b/i.test(prompt) &&
    /\b(?:employee|provider|stylist|therapist|staff|team member|specialist|barber|roster)\b/i.test(
      prompt,
    ) &&
    !/\b(?:invite|invitation|deactivate|remove|disable|delete|offboard)\b/i.test(
      prompt,
    )
  );
}

const UPDATE_EMPLOYEE_FIELD_WORDS =
  /(?:email|mail|phone|number|title|job\s+title|contact|profile|почт|телефон|номер|должност|профил|էլ\.?\s*փոստ|հեռախոս|պաշտոն)/iu;

export function isUpdateEmployeePrompt(prompt: string): boolean {
  if (
    /\b(?:booking|appointment|schedule|price|service\s+price|invite|deactivate|remove|delete|offboard|archive|webhook|notification)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  const lower = prompt.toLowerCase();
  if (
    matchLocale(lower, /(?:վերանվանիր|rename)/u) &&
    /(?:employee|provider|stylist|staff|team|աշխատակից|[A-Z][\p{L}'-]+\s+(?:to|որպես)\s)/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    matchLocale(lower, /(?:переименуй|переименовать)/u) &&
    /(?:сотрудник|provider|stylist|staff|команд|[A-Z][\p{L}'-]+\s+в\s)/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    matchLocale(lower, /(?:թարմացրու|փոխիր|դարձրու)/u) &&
    (UPDATE_EMPLOYEE_FIELD_WORDS.test(prompt) ||
      /(?:աշխատակից|provider|stylist|staff)/iu.test(prompt))
  ) {
    return true;
  }
  if (
    matchLocale(lower, /(?:обнови|измени|поменяй|смени)/u) &&
    UPDATE_EMPLOYEE_FIELD_WORDS.test(prompt) &&
    /(?:сотрудник|provider|stylist|staff|команд|[A-Z][\p{L}'-]+)/u.test(prompt)
  ) {
    return true;
  }
  if (/\brename\b/i.test(prompt)) {
    return (
      /\b(?:employee|provider|stylist|therapist|barber|specialist|staff|team member)\b/i.test(
        prompt,
      ) || /\brename\s+[A-Z][\p{L}'-]+\s+to\s+[A-Z]/u.test(prompt)
    );
  }
  return (
    /\b(?:update|edit|change|set|fix|correct)\b/i.test(prompt) &&
    UPDATE_EMPLOYEE_FIELD_WORDS.test(prompt) &&
    (/\b(?:employee|provider|stylist|therapist|barber|specialist|staff|team member)\b/i.test(
      prompt,
    ) ||
      /\b[A-Z][\p{L}'-]+(?:'s|’s)\s/u.test(prompt))
  );
}

export interface EmployeeUpdateFields {
  employeeName?: string;
  newName?: string;
  email?: string;
  phone?: string;
  title?: string;
}

export function extractEmployeeUpdateFromPrompt(
  prompt: string,
): EmployeeUpdateFields {
  const fields: EmployeeUpdateFields = {};

  const rename = prompt.match(
    /\b(?:rename|վերանվանիր|переименуй)\s+(?:employee\s+|provider\s+|stylist\s+|staff\s+member\s+|team\s+member\s+|barber\s+|therapist\s+|specialist\s+)?([A-Z][\p{L}'-]+)\s+(?:to|as|որպես|в)\s+([A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+)?)/iu,
  );
  if (rename) {
    fields.employeeName = rename[1].replace(/[-‑](ն|ին|ը|ի)$/u, '');
    fields.newName = rename[2].trim();
  }

  const possessive = prompt.match(
    /\b([A-Z][\p{L}']*?)(?:'s|’s|-ի)\s+(?:email|mail|phone|number|title|job\s+title|contact|profile|почт\w*|телефон|номер|должност\w*|հեռախոս|պաշտոն|էլ\.?\s*փոստ)/u,
  );
  if (!fields.employeeName && possessive) {
    fields.employeeName = possessive[1];
  }
  const ruField = prompt.match(
    /\b(?:email|почт\w*|телефон|номер|должност\w*)\s+(?:у\s+)?([A-Z][\p{L}'-]+)/u,
  );
  if (!fields.employeeName && ruField) {
    fields.employeeName = ruField[1];
  }
  if (!fields.employeeName) {
    const verbTarget = prompt.match(
      /\b(?:update|edit|change|fix|correct|թարմացրու|փոխիր|обнови|измени|поменяй|смени)\s+(?:employee\s+|provider\s+|stylist\s+|staff\s+member\s+|team\s+member\s+)?([A-Z][\p{L}'-]+)\b/u,
    );
    if (verbTarget) {
      const candidate = verbTarget[1];
      if (!STAFF_ROLE_WORDS.has(candidate.toLowerCase())) {
        fields.employeeName = candidate;
      }
    }
  }

  if (UPDATE_EMPLOYEE_FIELD_WORDS.test(prompt)) {
    if (/(?:email|mail|почт|էլ\.?\s*փոստ)/iu.test(prompt)) {
      const email = extractEmployeeEmailFromPrompt(prompt);
      if (email) fields.email = email;
    }
    if (/(?:phone|number|телефон|номер|հեռախոս)/iu.test(prompt)) {
      const phone = prompt.match(/(\+?\d[\d\s().-]{5,}\d)/);
      if (phone) fields.phone = phone[1].trim();
    }
    const title = prompt.match(
      /\b(?:title|job\s+title|должность|պաշտոնը?)\s+(?:to|на|որպես)?\s*["']?([A-Z][\w\s'-]{1,40}?)["']?\s*$/iu,
    );
    if (title) fields.title = title[1].trim();
  }

  return fields;
}

export function isInviteStaffMemberPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    matchLocale(lower, /(?:հրավիր|ուղարկ.*հրավեր)/u) &&
    /(?:staff|employee|provider|stylist|team|app|dashboard|աշխատակից)/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    matchLocale(lower, /(?:приглас|отправ.*приглаш)/u) &&
    /(?:staff|employee|provider|stylist|команд|приложен|dashboard|сотрудник)/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  return (
    /\b(?:invite|invitation|send\s+(?:an?\s+)?invitation)\b/i.test(prompt) &&
    /\b(?:staff|employee|provider|stylist|team|app\s+access|dashboard|member)\b/i.test(
      prompt,
    )
  );
}

export function isDeactivateEmployeePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    matchLocale(lower, /(?:ապաակտիվ|հեռացր|ջնջ|արխիվ|offboard)/u) &&
    (/(?:աշխատակից|provider|stylist|staff|team|employee|roster)/iu.test(
      prompt,
    ) ||
      /թիմից/iu.test(prompt))
  ) {
    return true;
  }
  if (
    matchLocale(lower, /(?:деактив|удал|убер|архив|снять|offboard)/u) &&
    (/(?:сотрудник|provider|stylist|staff|команд|employee|roster)/iu.test(
      prompt,
    ) ||
      /из\s+команд/i.test(prompt))
  ) {
    return true;
  }
  return (
    /\b(?:deactivate|remove|delete|offboard|archive)\b/i.test(prompt) &&
    (/\b(?:employee|provider|stylist|staff|team member|specialist|roster)\b/i.test(
      prompt,
    ) ||
      /\bfrom\s+(?:the\s+)?(?:team|staff|roster)\b/i.test(prompt)) &&
    !/\b(?:appointment|booking|schedule)\b/i.test(prompt)
  );
}

export function isConfigureOnlineBookingPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    /\b(online\s+payment|prepayment|pre[-\s]?pay|deposit|pay\s+online|stripe|card\s+checkout)\b/i.test(
      prompt,
    ) &&
    /\bservices?\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(?:cookie|consent|privacy|retention|hipaa|gdpr|compliance|banner|push|notification|напоминан|оповещен|alert|fcm|format|дата|preferences|reminder)\b/i.test(
      lower,
    )
  ) {
    return false;
  }
  if (
    matchLocale(
      lower,
      /(?:միացր|անջատ|կարգավոր|ակտիվացր|թաքցր|կանգնեցր|թույլ\s+տուր|set\s+up)/u,
    ) &&
    /(?:online\s+booking|public\s+booking|booking\s+(?:page|website|link)|book\s+online)/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    matchLocale(lower, /(?:включ|отключ|настро|активир|скры|скрой|останов|разреш)/u) &&
    /(?:online\s+booking|public\s+booking|booking\s+(?:page|website|link)|book\s+online|публичн\w*\s+(?:страниц\w*|booking)|онлайн[-\s]?(?:booking|запис))/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  return (
    /\b(?:configure|enable|disable|turn\s+(?:on|off)|set\s+up|activate|allow|stop|hide)\b/i.test(
      prompt,
    ) &&
    /\b(?:online\s+booking|public\s+booking|booking\s+(?:page|website|link)|book\s+online)\b/i.test(
      prompt,
    )
  );
}

export function rescueStaffOperationsIntent(
  prompt: string,
  action: string,
): { action: StaffOperationsIntent; rescueReason: string } | null {
  if (
    isCreateEmployeePrompt(prompt) &&
    action !== 'create_employee' &&
    !isAssignCategoryToProviderPrompt(prompt)
  ) {
    return { action: 'create_employee', rescueReason: 'create_employee' };
  }
  if (isUpdateEmployeePrompt(prompt) && action !== 'update_employee') {
    return { action: 'update_employee', rescueReason: 'update_employee' };
  }
  if (isInviteStaffMemberPrompt(prompt) && action !== 'invite_staff_member') {
    return {
      action: 'invite_staff_member',
      rescueReason: 'invite_staff_member',
    };
  }
  if (isDeactivateEmployeePrompt(prompt) && action !== 'deactivate_employee') {
    return {
      action: 'deactivate_employee',
      rescueReason: 'deactivate_employee',
    };
  }
  if (
    isConfigureOnlineBookingPrompt(prompt) &&
    action !== 'configure_online_booking'
  ) {
    return {
      action: 'configure_online_booking',
      rescueReason: 'configure_online_booking',
    };
  }
  return null;
}

export function extractEmployeeEmailFromPrompt(prompt: string): string | null {
  const match = prompt.match(
    /\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/i,
  );
  return match?.[1]?.toLowerCase() ?? null;
}

const STAFF_ROLE_WORDS = new Set([
  'stylist',
  'provider',
  'employee',
  'therapist',
  'barber',
  'specialist',
  'manager',
  'member',
  'staff',
  'team',
  'color',
  'new',
]);

function normalizeExtractedEmployeeName(name: string | undefined): string | null {
  if (!name) return null;
  const trimmed = name
    .trim()
    .replace(/[-‑](ն|ին|ը|ներ)$/u, '')
    .trim();
  if (!trimmed || STAFF_ROLE_WORDS.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

export function extractEmployeeNameFromPrompt(prompt: string): string | null {
  const roleName = prompt.match(
    /\b(?:provider|stylist|employee|therapist|barber|specialist|manager)\s+([A-Z][\p{L}'-]+)(?:\s|$|@)/u,
  );
  const fromRole = normalizeExtractedEmployeeName(roleName?.[1]);
  if (fromRole) return fromRole;

  const memberName = prompt.match(
    /\b(?:team member|staff member)\s+([A-Z][\p{L}'-]+)/u,
  );
  const fromMember = normalizeExtractedEmployeeName(memberName?.[1]);
  if (fromMember) return fromMember;

  const deactivate = prompt.match(
    /\b(?:deactivate|remove|delete|offboard|archive)\s+(?:employee|provider|stylist|staff|team member)?\s*([A-Z][\p{L}'-]+)(?:\s+from\b|\s+on\b|$)/u,
  );
  const fromDeactivate = normalizeExtractedEmployeeName(deactivate?.[1]);
  if (fromDeactivate) return fromDeactivate;

  const inviteIdx = prompt.search(/\binvite\b/i);
  if (inviteIdx >= 0) {
    const inviteTail = prompt.slice(inviteIdx).replace(/^\s*invite\s+/i, '');
    const inviteSimple = inviteTail.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
    const fromInviteSimple = normalizeExtractedEmployeeName(inviteSimple?.[1]);
    if (fromInviteSimple) return fromInviteSimple;
  }

  const inviteName = prompt.match(
    /\b(?:send\s+(?:an?\s+)?(?:staff\s+)?invitation\s+to|invitation\s+to)\s+([A-Z][\p{L}'-]+)(?:\s+for\b|\s+to\b|\s+on\b|$)/u,
  );
  if (inviteName?.[1] && !inviteName[1].includes('@')) {
    const fromInvite = normalizeExtractedEmployeeName(inviteName[1]);
    if (fromInvite) return fromInvite;
  }

  const add = prompt.match(
    /\b(?:add|create|hire|onboard|register)\s+(?:(?:new\s+)?(?:\w+\s+)*?)([A-Z][\p{L}'-]+)(?:\s+to\b|\s+with\b|\s+for\b|\s+on\b|\s+as\b|$)/u,
  );
  const fromAdd = normalizeExtractedEmployeeName(add?.[1]);
  if (fromAdd) return fromAdd;

  const fromTeam = prompt.match(
    /\b([A-Z][\p{L}'-]+)\s+from\s+(?:the\s+)?(?:team|staff|roster)\b/u,
  );
  const fromTeamName = normalizeExtractedEmployeeName(fromTeam?.[1]);
  if (fromTeamName) return fromTeamName;

  const hyInvite = prompt.match(/(?:հրավիր|ուղարկ.*հրավեր).{0,20}?([A-Z][a-z]+)/iu);
  const fromHyInvite = normalizeExtractedEmployeeName(hyInvite?.[1]);
  if (fromHyInvite) return fromHyInvite;

  const hyDeactivate = prompt.match(
    /(?:ապաակտիվացր|հեռացր|ջնջ).{0,30}?([A-Z][a-z]+|[Ա-Ֆ][ա-ֆ]+)/u,
  );
  const fromHyDeactivate = normalizeExtractedEmployeeName(hyDeactivate?.[1]);
  if (fromHyDeactivate) return fromHyDeactivate;

  const ruInvite = prompt.match(/(?:приглас|отправ.*приглаш).{0,20}?([A-Z][a-z]+)/iu);
  const fromRuInvite = normalizeExtractedEmployeeName(ruInvite?.[1]);
  if (fromRuInvite) return fromRuInvite;

  const ruDeactivate = prompt.match(
    /(?:деактивируй|удали|убери|архивируй).{0,30}?([A-Z][a-z]+|[А-ЯЁ][а-яё]+)/u,
  );
  const fromRuDeactivate = normalizeExtractedEmployeeName(ruDeactivate?.[1]);
  if (fromRuDeactivate) return fromRuDeactivate;

  const hyCreate = prompt.match(
    /(?:ավելացր|ստեղծ|գրանց|ընդուն|hire|onboard).{0,40}?([A-Z][\p{L}'-]+)/iu,
  );
  if (hyCreate?.[1]) return hyCreate[1].trim();

  const ruCreate = prompt.match(
    /(?:добав|созда|наним|зарегистр|онборд).{0,40}?([A-Z][\p{L}'-]+)/iu,
  );
  if (ruCreate?.[1]) return ruCreate[1].trim();

  return null;
}

export function extractServiceNamesFromPrompt(
  prompt: string,
): string[] | undefined {
  const withServices = prompt.match(
    /\bwith\s+([\w\s,and]+?)\s+services?\b/i,
  );
  if (!withServices?.[1]) return undefined;
  return withServices[1]
    .split(/\s+and\s+|,\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseOnlineBookingEnabledFromPrompt(
  prompt: string,
): boolean | null {
  if (
    /(?:անջատ|թաքցր|կանգնեցր|hide|stop|disable|turn\s+off)/iu.test(prompt) &&
    /(?:online|public|booking).{0,30}(?:booking|link|page|website)?/iu.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /(?:отключ|скры|скрой|останов|hide|stop|disable|turn\s+off)/iu.test(prompt) &&
    /(?:online|public|онлайн|публичн|booking).{0,30}(?:booking|запис|link|page)?/iu.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /(?:միացր|ակտիվացր|թույլ\s+տուր|enable|turn\s+on|activate|allow)/iu.test(
      prompt,
    ) &&
    /(?:online|public|booking|book\s+online).{0,30}(?:booking|link|page|website)?/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /(?:включ|активир|разреш|allow|enable|turn\s+on)/iu.test(prompt) &&
    /(?:online|public|онлайн|публичн|booking|book\s+online).{0,30}(?:booking|запис|link|page)?/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(?:disable|turn\s+off|hide|stop)\b/i.test(prompt) &&
    /\b(?:online|public)\s+booking\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(?:enable|turn\s+on|activate|allow)\b/i.test(prompt) &&
    /\b(?:online|public)\s+booking\b/i.test(prompt)
  ) {
    return true;
  }
  return null;
}

export function enrichStaffOperationsRescueParams(
  action: StaffOperationsIntent,
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const enriched = { ...params };
  if (action === 'create_employee') {
    if (!enriched.employeeName) {
      const name = extractEmployeeNameFromPrompt(prompt);
      if (name) enriched.employeeName = name;
    }
    if (!enriched.email) {
      const email = extractEmployeeEmailFromPrompt(prompt);
      if (email) enriched.email = email;
    }
    if (!enriched.serviceNames) {
      const services = extractServiceNamesFromPrompt(prompt);
      if (services?.length) enriched.serviceNames = services;
    }
  } else if (action === 'update_employee') {
    const update = extractEmployeeUpdateFromPrompt(prompt);
    if (!enriched.employeeName && update.employeeName) {
      enriched.employeeName = update.employeeName;
    }
    if (!enriched.newName && update.newName) enriched.newName = update.newName;
    if (!enriched.email && update.email) enriched.email = update.email;
    if (!enriched.phone && update.phone) enriched.phone = update.phone;
    if (!enriched.title && update.title) enriched.title = update.title;
  } else if (action === 'invite_staff_member') {
    if (!enriched.email) {
      const email = extractEmployeeEmailFromPrompt(prompt);
      if (email) enriched.email = email;
    }
    if (!enriched.employeeName) {
      const name = extractEmployeeNameFromPrompt(prompt);
      if (name) enriched.employeeName = name;
    }
  } else if (action === 'deactivate_employee') {
    if (!enriched.employeeName) {
      const name = extractEmployeeNameFromPrompt(prompt);
      if (name) enriched.employeeName = name;
    }
  } else if (action === 'configure_online_booking') {
    if (typeof enriched.enabled !== 'boolean') {
      const enabled = parseOnlineBookingEnabledFromPrompt(prompt);
      if (enabled !== null) enriched.enabled = enabled;
    }
  }
  return enriched;
}
