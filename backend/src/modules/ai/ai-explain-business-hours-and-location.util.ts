import { parseBusinessHoursWindow, isComplianceCheckPrompt } from './ai-operations.util.js';
import { isExplainBusinessLanguagesPrompt } from './ai-business-languages.util.js';
import { isApplyClinicPlaybookPrompt } from './ai-clinic-service.util.js';

export const CUSTOMER_PUBLIC_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CLASSIFIER_RULES = `- explain_business_hours_and_location: READ — explain salon opening hours (including a named weekday), street address, Google Maps link from the profile embed, and optional parking amenity copy. Triggers: "When are you open Saturday?", "Where are you located?", "What are your hours?", "Is there parking?", "What's the address?". Set aspect to hours|location|parking|hours_and_location when clear; set weekday for a named day. Navigate to profile when sharing map/address. NOT explain_salon_profile (general salon profile page / photos / social), NOT get_directions_to_salon (navigation/directions URL or visit parking guidance), NOT business_info (general salon description/contact dump), NOT booking_help (how to book), and NOT check_availability (slot search).`;

/** e2e-bug.137 — dashboard owner/admin hours/address reads (not location CRUD, not schedule templates). */
export const DASHBOARD_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CLASSIFIER_RULES = `- explain_business_hours_and_location: READ — salon opening hours, street address, map link, or parking copy from the business profile. Triggers: "What are my business hours?", "When are we open Saturday?", "What's our address?", "Do we have parking info listed?". Set aspect to hours|location|parking|hours_and_location; set weekday for a named day. NOT create_location / update_location (admin location CRUD), NOT list_templates (schedule template names), NOT check_schedule_compliance (appointments outside hours), and NOT react_agent.`;

export type BusinessHoursLocationAspect =
  | 'hours'
  | 'location'
  | 'parking'
  | 'hours_and_location';

export type ExplainBusinessHoursAndLocationPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_business_hours_and_location';
  aspect?: BusinessHoursLocationAspect;
  weekday?: string;
  rescueReason: 'business_hours_location';
};

export const EXPLAIN_BUSINESS_HOURS_AND_LOCATION_PROMPTS: readonly ExplainBusinessHoursAndLocationPromptFixture[] =
  [
    {
      id: 'open-saturday-customer',
      prompt: 'When are you open Saturday?',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      weekday: 'saturday',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'where-located-customer',
      prompt: 'Where are you located?',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'location',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'opening-hours-customer',
      prompt: 'What are your opening hours?',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'parking-customer',
      prompt: 'Is there parking?',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'parking',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'address-customer',
      prompt: "What's the address?",
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'location',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'close-time-customer',
      prompt: 'What time do you close?',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'hours-and-address-customer',
      prompt: 'What are your hours and where are you located?',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours_and_location',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'open-sunday-customer',
      prompt: 'Are you open on Sunday?',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      weekday: 'sunday',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'map-link-customer',
      prompt: 'Do you have a map link?',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'location',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'friday-hours-customer',
      prompt: 'What are your Friday hours?',
      surface: 'customer',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      weekday: 'friday',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'open-saturday-public',
      prompt: 'When are you open Saturday?',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      weekday: 'saturday',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'where-located-public',
      prompt: 'Where are you located?',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'location',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'opening-hours-public',
      prompt: 'What are your opening hours?',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'parking-public',
      prompt: 'Is there parking?',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'parking',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'address-public',
      prompt: "What's the address?",
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'location',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'close-time-public',
      prompt: 'What time do you close?',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'hours-and-address-public',
      prompt: 'What are your hours and where are you located?',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours_and_location',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'open-sunday-public',
      prompt: 'Are you open on Sunday?',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      weekday: 'sunday',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'map-link-public',
      prompt: 'Do you have a map link?',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'location',
      rescueReason: 'business_hours_location',
    },
    {
      id: 'friday-hours-public',
      prompt: 'What are your Friday hours?',
      surface: 'public',
      expectedAction: 'explain_business_hours_and_location',
      aspect: 'hours',
      weekday: 'friday',
      rescueReason: 'business_hours_location',
    },
  ];

const WEEKDAY_ALIASES: ReadonlyArray<[RegExp, string]> = [
  [/\bmonday\b/i, 'monday'],
  [/\btuesday\b/i, 'tuesday'],
  [/\bwednesday\b/i, 'wednesday'],
  [/\bthursday\b/i, 'thursday'],
  [/\bfriday\b/i, 'friday'],
  [/\bsaturday\b/i, 'saturday'],
  [/\bsunday\b/i, 'sunday'],
  [/երկուշաբթի/u, 'monday'],
  [/երեքշաբթի/u, 'tuesday'],
  [/չորեքշաբթի/u, 'wednesday'],
  [/հինգշաբթի/u, 'thursday'],
  [/ուրբաթ/u, 'friday'],
  [/շաբաթ/u, 'saturday'],
  [/կիրակի/u, 'sunday'],
  [/понедельник/iu, 'monday'],
  [/вторник/iu, 'tuesday'],
  [/сред[аы]/iu, 'wednesday'],
  [/четверг/iu, 'thursday'],
  [/пятниц/iu, 'friday'],
  [/суббот/iu, 'saturday'],
  [/воскресен/iu, 'sunday'],
];

function hasHoursCue(prompt: string): boolean {
  return (
    /\b(?:open(?:ing)?\s+hours?|business\s+hours?|operating\s+hours?|what\s+time|when\s+are\s+you\s+open|are\s+you\s+open|close|closing|hours?\s+on|your\s+hours|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+hours?)\b/i.test(
      prompt,
    ) ||
    /(?:աշխատանքային|բաց(?!իր|ատրիր)|ժամեր|երբ)/iu.test(prompt) ||
    /(?:часы|открыт|работаете|закрыва)/iu.test(prompt)
  );
}

function hasSalonDirectionsCue(prompt: string): boolean {
  return (
    /\b(?:directions?|navigate|how\s+do\s+i\s+(?:get|drive)|get\s+there|where\s+(?:can\s+i|do\s+i|should\s+i)\s+park|where\s+to\s+park|google\s+maps\s+directions?)\b/i.test(
      prompt,
    ) ||
    /(?:ուղղություն|որտեղ\s+կայան|ինչպես\s+գալ|ինչպես\s+հասն)/iu.test(prompt) ||
    /(?:как\s+добраться|как\s+проехать|где\s+(?:при)?парков|где\s+парковаться|навигац)/iu.test(
      prompt,
    )
  );
}

function hasLocationCue(prompt: string): boolean {
  return (
    /\b(?:where\s+are\s+you|located|location|address|map\s+link|find\s+you)\b/i.test(
      prompt,
    ) ||
    /(?:որտեղ|հասցե|տեղադր)/iu.test(prompt) ||
    /(?:где\s+(?:вы\s+)?находитесь|адрес|карта)/iu.test(prompt)
  );
}

function hasParkingCue(prompt: string): boolean {
  return (
    /\b(?:parking|is\s+there\s+parking)\b/i.test(prompt) ||
    /(?:կայանատեղ|կայանատեղի)/iu.test(prompt) ||
    /(?:есть\s+ли\s+парков|парковк)/iu.test(prompt)
  );
}

export function extractWeekdayFromHoursPrompt(prompt: string): string | null {
  for (const [pattern, weekday] of WEEKDAY_ALIASES) {
    if (pattern.test(prompt)) return weekday;
  }
  return null;
}

export function inferBusinessHoursLocationAspect(
  prompt: string,
): BusinessHoursLocationAspect {
  const hours = hasHoursCue(prompt);
  const location = hasLocationCue(prompt);
  const parking = hasParkingCue(prompt);

  if ((hours || location) && parking) return 'hours_and_location';
  if (hours && location) return 'hours_and_location';
  if (parking) return 'parking';
  if (location) return 'location';
  return 'hours';
}

export function isExplainBusinessHoursAndLocationPrompt(
  prompt: string,
): boolean {
  if (isComplianceCheckPrompt(prompt)) return false;
  if (isExplainBusinessLanguagesPrompt(prompt)) return false;
  if (isApplyClinicPlaybookPrompt(prompt)) return false;
  if (
    /(ամսաթվ|ժամ.{0,12}(?:ձևաչափ|կարգավոր)|date\s*format|time\s*format)/i.test(
      prompt,
    ) &&
    /(բացատրիր|ինչ|որ|կարգավոր|explain|settings)/i.test(prompt)
  ) {
    return false;
  }
  if (
    /(?:բացիր|открой).*(?:պրոֆիլ|profile|ծառայություն|услуг|маснագիր|специалист)/iu.test(
      prompt,
    )
  ) {
    return false;
  }
  if (hasSalonDirectionsCue(prompt)) return false;

  // e2e-bug.146 — admin location CRUD must not match on bare "location"/"address".
  if (
    /\b(?:add|create|open|set\s+up|setup)\b/i.test(prompt) &&
    /\b(?:new\s+)?(?:business\s+)?location\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(?:update|edit|change|rename)\b/i.test(prompt) &&
    /\b(?:location|branch)\b/i.test(prompt) &&
    /\b(?:address|phone|timezone|default|name)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(?:main|default|primary)\s+location\b/i.test(prompt) &&
    /\b(?:update|edit|change|set|address|phone|timezone)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(?:book|reserve|schedule)\b/i.test(prompt) &&
    /\b(?:slot|appointment)\b/i.test(prompt)
  ) {
    return false;
  }

  const hours = hasHoursCue(prompt);
  const location = hasLocationCue(prompt);
  const parking = hasParkingCue(prompt);
  if (!hours && !location && !parking) return false;

  if (
    /\b(?:tell me about|what is this|about the salon|about your business)\b/i.test(
      prompt,
    ) &&
    !hours &&
    !location &&
    !parking
  ) {
    return false;
  }

  return true;
}

export function enrichExplainBusinessHoursLocationParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const aspect =
    (params.aspect as BusinessHoursLocationAspect | undefined) ??
    inferBusinessHoursLocationAspect(prompt);
  const weekday =
    (params.weekday as string | undefined) ??
    extractWeekdayFromHoursPrompt(prompt) ??
    undefined;
  return {
    ...params,
    aspect,
    ...(weekday ? { weekday } : {}),
  };
}

export function rescueExplainBusinessHoursAndLocationIntent(
  prompt: string,
  action: string,
): {
  action: 'explain_business_hours_and_location';
  rescueReason: string;
} | null {
  if (action === 'explain_business_hours_and_location') return null;
  if (!isExplainBusinessHoursAndLocationPrompt(prompt)) return null;
  return {
    action: 'explain_business_hours_and_location',
    rescueReason: 'business_hours_location',
  };
}

export function detectExplainBusinessHoursAndLocationAction(
  prompt: string,
): 'explain_business_hours_and_location' | null {
  return (
    rescueExplainBusinessHoursAndLocationIntent(prompt, 'unknown')?.action ??
    null
  );
}

function formatMinutesLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function readBusinessLocationSettings(
  settings: Record<string, unknown> | undefined,
): {
  mapEmbedHtml?: string;
  parkingCopy?: string;
} {
  const location = (settings?.location ?? {}) as Record<string, unknown>;
  const parkingCopy =
    typeof location.parkingCopy === 'string'
      ? location.parkingCopy.trim()
      : typeof location.parkingNotes === 'string'
        ? location.parkingNotes.trim()
        : undefined;
  return {
    mapEmbedHtml:
      typeof location.mapEmbedHtml === 'string'
        ? location.mapEmbedHtml
        : undefined,
    ...(parkingCopy ? { parkingCopy } : {}),
  };
}

export function extractGoogleMapsUrl(mapEmbedHtml?: string): string | null {
  if (!mapEmbedHtml) return null;
  const match = mapEmbedHtml.match(/src=["']([^"']+)["']/i);
  const src = match?.[1]?.trim();
  return src && /^https?:\/\//i.test(src) ? src : null;
}

export function formatBusinessHoursLabel(
  settings: Record<string, unknown> | undefined,
  weekday?: string | null,
): string {
  const hours = settings?.hours ?? settings?.businessHours;
  if (weekday && hours && typeof hours === 'object' && !Array.isArray(hours)) {
    const record = hours as Record<string, unknown>;
    const day = record[weekday] ?? record[weekday.slice(0, 3)];
    if (typeof day === 'string' && day.trim()) return day.trim();
    if (day && typeof day === 'object') {
      const dayRecord = day as Record<string, unknown>;
      if (dayRecord.closed === true) return 'Closed';
      const open = dayRecord.open ?? dayRecord.start;
      const close = dayRecord.close ?? dayRecord.end;
      if (open != null && close != null) return `${open}–${close}`;
    }
  }
  if (typeof hours === 'string' && hours.trim()) return hours.trim();
  const window = parseBusinessHoursWindow(settings);
  return `${formatMinutesLabel(window.openMinutes)}–${formatMinutesLabel(window.closeMinutes)}`;
}

export function formatWeekdayLabel(weekday: string): string {
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}
