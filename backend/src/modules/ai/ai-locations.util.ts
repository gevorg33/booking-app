/** ai-cmd-dashboard-6.12.3 — business location CRUD (dashboard, manager+). */

export const DASHBOARD_LOCATIONS_MUTATE_INTENTS = [
  'create_location',
  'update_location',
] as const;

export type LocationsIntent =
  (typeof DASHBOARD_LOCATIONS_MUTATE_INTENTS)[number];

const LOCATIONS_INTENT_SET = new Set<string>(
  DASHBOARD_LOCATIONS_MUTATE_INTENTS,
);

export function isLocationsIntent(action: string): action is LocationsIntent {
  return LOCATIONS_INTENT_SET.has(action);
}

export interface LocationLike {
  id: string;
  name: string;
  isDefault?: boolean;
}

/** e2e-bug.146 — "main"/"default"/"primary" resolve to the default location. */
export function resolveLocationFromList<T extends LocationLike>(
  locations: T[],
  params: Record<string, unknown>,
): T | undefined {
  const id =
    typeof params.locationId === 'string' && params.locationId.trim()
      ? params.locationId.trim()
      : undefined;
  if (id) return locations.find((entry) => entry.id === id);

  const name =
    typeof params.locationName === 'string' && params.locationName.trim()
      ? params.locationName.trim()
      : undefined;
  if (!name) return undefined;

  const needle = name.toLowerCase();
  if (
    needle === 'main' ||
    needle === 'default' ||
    needle === 'primary' ||
    needle === 'hq'
  ) {
    return locations.find((entry) => entry.isDefault === true) ?? locations[0];
  }

  return (
    locations.find((entry) => entry.name.toLowerCase() === needle) ??
    locations.find((entry) => entry.name.toLowerCase().includes(needle))
  );
}

export interface ParsedCreateLocation {
  name: string;
  address?: string;
  phone?: string;
  timezone?: string;
  isDefault?: boolean;
}

export interface ParsedUpdateLocation {
  locationName: string;
  newName?: string;
  address?: string;
  phone?: string;
  timezone?: string;
  isDefault?: boolean;
}

const LOCATION_MUTATE_VERB =
  /\b(add|create|open|set(?:\s+up)?|setup|update|edit|change|rename|move|make)\b/i;

export function isCreateLocationPrompt(prompt: string): boolean {
  if (!/\blocation\b/i.test(prompt)) return false;
  if (/\b(update|edit|change|rename|move)\b/i.test(prompt)) return false;
  if (
    /\b(hours?|open(?:ing)?|parking|directions?|address\s+of|where\s+are\s+you)\b/i.test(
      prompt,
    ) &&
    !/\b(add|create|new|called|named)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(add|create|open|set\s+up|setup)\b/i.test(prompt) &&
    /\b(new\s+)?(?:business\s+)?location\b/i.test(prompt)
  );
}

export function isUpdateLocationPrompt(prompt: string): boolean {
  if (isCreateLocationPrompt(prompt)) return false;
  if (
    /\b(hours?|open(?:ing)?|parking|directions?|where\s+are\s+you)\b/i.test(
      prompt,
    ) &&
    !/\b(update|edit|change|rename|address|phone|timezone|default)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (!LOCATION_MUTATE_VERB.test(prompt)) return false;

  if (/\b(?:main|default|primary)\s+location\b/i.test(prompt)) return true;
  if (
    /\blocation\b/i.test(prompt) &&
    /\b(address|phone|timezone|default|rename)\b/i.test(prompt)
  ) {
    return true;
  }
  // "Set Downtown's phone number to …" / "Change Uptown Branch address to …"
  if (
    /\b(?:set|update|change|edit)\s+[A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)?'s\s+(?:phone|address|timezone)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(?:branch|location)\b/i.test(prompt) &&
    /\b(address|phone|timezone|default)\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

export function parseCreateLocationFromPrompt(
  prompt: string,
): ParsedCreateLocation | null {
  const called = prompt.match(
    /\b(?:called|named)\s+([A-Za-z0-9][\w\s'-]{0,60}?)(?:\s+at\s+|\s+with\s+|\s*,\s*|\s*$)/i,
  );
  const createNamed = prompt.match(
    /\b(?:add|create|open|set\s+up|setup)\s+(?:a\s+)?(?:new\s+)?(?:business\s+)?location\s+(?:called\s+|named\s+)?([A-Za-z0-9][\w\s'-]{0,60}?)(?:\s+at\s+|\s+with\s+|\s*,\s*|\s*$)/i,
  );
  const name = (called?.[1] ?? createNamed?.[1] ?? '').trim();
  if (!name || name.length < 2) return null;

  const addressMatch = prompt.match(
    /\bat\s+([0-9][\w\s.,'#/-]{2,80}?)(?:\s+with\s+|\s*,\s*|\s*[.?!]|$)/i,
  );
  const phoneMatch = prompt.match(
    /\b(?:phone|tel)\s*(?:number\s*)?(?:to\s+|is\s+|:\s*)?([+\d][\d\s()-]{6,20})/i,
  );
  const timezoneMatch = prompt.match(
    /\b(?:timezone|time\s*zone)\s+(?:to\s+)?([A-Za-z_/+-]{3,40})/i,
  );
  const isDefault = /\b(?:default|primary|main)\s+location\b/i.test(prompt)
    ? true
    : undefined;

  return {
    name,
    ...(addressMatch?.[1] ? { address: addressMatch[1].trim() } : {}),
    ...(phoneMatch?.[1] ? { phone: phoneMatch[1].trim() } : {}),
    ...(timezoneMatch?.[1] ? { timezone: timezoneMatch[1].trim() } : {}),
    ...(isDefault !== undefined ? { isDefault } : {}),
  };
}

export function parseUpdateLocationFromPrompt(
  prompt: string,
): ParsedUpdateLocation | null {
  const mainCue = /\b(?:my\s+)?(?:main|default|primary)\s+location\b/i.test(
    prompt,
  );
  const possessive = prompt.match(
    /\b(?:set|update|change|edit)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)?)'s\s+(?:phone|address|timezone)\b/i,
  );
  const named = prompt.match(
    /\b(?:location|branch)\s+(?:named\s+|called\s+)?["']?([A-Za-z0-9][\w\s'-]{0,40}?)["']?(?:'s|\s+address|\s+phone|\s+timezone|\s+to\b)/i,
  );
  const makeDefault = prompt.match(
    /\bmake\s+([A-Za-z0-9][\w\s'-]{0,40}?)\s+the\s+default\b/i,
  );
  const locationName = mainCue
    ? 'main'
    : (possessive?.[1] ?? named?.[1] ?? makeDefault?.[1] ?? '')
        .trim()
        .replace(/'s$/i, '');
  if (!locationName) return null;

  const addressMatch =
    prompt.match(
      /\baddress\s+to\s+([0-9][\w\s.,'#/-]{2,80}?)(?:\s*[.?!]|$)/i,
    ) ?? prompt.match(/\bat\s+([0-9][\w\s.,'#/-]{2,80}?)(?:\s*[.?!]|$)/i);
  const phoneMatch = prompt.match(
    /\b(?:phone|tel)\s*(?:number\s*)?(?:to\s+|is\s+|:\s*)?([+\d][\d\s()-]{6,20})/i,
  );
  const newNameMatch = prompt.match(
    /\b(?:rename|new\s+name)\s+(?:to\s+)?["']?([A-Za-z0-9][\w\s'-]{1,40}?)["']?(?:\s*[.?!]|$)/i,
  );
  const timezoneMatch = prompt.match(
    /\b(?:timezone|time\s*zone)\s+(?:to\s+)?([A-Za-z_/+-]{3,40})/i,
  );
  const isDefault = /\bmake\b.+\b(?:the\s+)?default\b/i.test(prompt)
    ? true
    : undefined;

  if (
    !addressMatch &&
    !phoneMatch &&
    !newNameMatch &&
    !timezoneMatch &&
    isDefault === undefined
  ) {
    return null;
  }

  return {
    locationName,
    ...(newNameMatch?.[1] ? { newName: newNameMatch[1].trim() } : {}),
    ...(addressMatch?.[1] ? { address: addressMatch[1].trim() } : {}),
    ...(phoneMatch?.[1] ? { phone: phoneMatch[1].trim() } : {}),
    ...(timezoneMatch?.[1] ? { timezone: timezoneMatch[1].trim() } : {}),
    ...(isDefault !== undefined ? { isDefault } : {}),
  };
}

/** e2e-bug.146 — rescue when classifier falls to unknown / react_agent. */
export function rescueLocationsIntent(
  prompt: string,
  action: string,
): { action: LocationsIntent; rescueReason: string } | null {
  if (isLocationsIntent(action)) return null;

  if (isCreateLocationPrompt(prompt) && parseCreateLocationFromPrompt(prompt)) {
    return { action: 'create_location', rescueReason: 'create_location' };
  }
  if (isUpdateLocationPrompt(prompt) && parseUpdateLocationFromPrompt(prompt)) {
    return { action: 'update_location', rescueReason: 'update_location' };
  }
  return null;
}
