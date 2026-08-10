import {
  isTourDifficulty,
  type TourDifficulty,
} from '../../common/utils/tour-service.util.js';
import { isExplainPackageDisplayNamePrompt } from './ai-package-display-name.util.js';
import { isExplainTourBookingRecordPrompt } from './ai-tour-booking-record.util.js';
import { isExplainTourCalendarSpanPrompt } from './ai-tour-calendar-span.util.js';
import { isListTourCalendarWeekPrompt } from './ai-tour-calendar-week.util.js';
import { isListUpcomingTourDeparturesPrompt } from './ai-upcoming-tour-departures.util.js';
import { isDiagnoseTourCapacityPrompt } from './ai-tour-capacity.util.js';
import { isExplainTourMeetingPointPrompt } from './ai-tour-meeting-point.util.js';

export const TOUR_SERVICE_INTENTS = [
  'configure_tour_service',
  'explain_tour_services',
  'explain_tour_booking_record',
  'explain_tour_calendar_span',
  'list_tour_calendar_week',
  'list_upcoming_tour_departures',
  'apply_tour_playbook',
] as const;

export const TOUR_SERVICE_MUTATE_INTENTS = [
  'configure_tour_service',
  'apply_tour_playbook',
] as const;

export const TOUR_SERVICE_READ_INTENTS = [
  'explain_tour_services',
  'explain_tour_booking_record',
  'explain_tour_calendar_span',
  'list_tour_calendar_week',
  'list_upcoming_tour_departures',
] as const;

export type TourServiceIntent = (typeof TOUR_SERVICE_INTENTS)[number];

export interface ParsedExplainTourServices {
  serviceName?: string;
  serviceId?: string;
  daysAhead?: number;
  includeServices?: boolean;
  includeBookings?: boolean;
}

export interface ParsedConfigureTourService {
  serviceName?: string;
  serviceId?: string;
  enableTour?: boolean;
  maxGroupSize?: number;
  difficulty?: TourDifficulty;
  coverImage?: string;
  meetingPoint?: string;
  includedItems?: string;
  durationDays?: number;
}

const DIFFICULTY_ALIASES: Record<string, TourDifficulty> = {
  easy: 'easy',
  moderate: 'moderate',
  challenging: 'challenging',
  hard: 'challenging',
  difficult: 'challenging',
};

function hasTourConfigureSurface(prompt: string): boolean {
  return (
    /\b(tour|trek|excursion|group\s+size|max\s+group|meeting\s+point|duration\s+days?|cover\s+image|included\s+items?|difficulty|pax|guests?|people|person\s+cap|capacity)\b/i.test(
      prompt,
    ) ||
    /\bas\s+a\s+tour\b/i.test(prompt) ||
    /\btour\s+mode\b/i.test(prompt) ||
    /(էքսկուրսիա|տուր|խումբ|խմբ|հանդիպման|դժվարություն|հոգի|հյուր|օր|ռեժիմ)/i.test(
      prompt,
    ) ||
    /(тур|экскурс|групп|сложност|встреч|человек|гост|pax|режим)/i.test(prompt)
  );
}

function isMutateTourConfigurePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(set|mark|enable|make|turn|update|change|configure|put|assign|add|remove|clear)\b/i.test(
      prompt,
    ) ||
    /(նշ|սահման|դարձր|փոխ|ակտիվացր|թարմացր|թարմացն)/i.test(lower) ||
    /(установ|отмет|включ|сделай|измен|обнов|задай)/i.test(lower)
  );
}

function hasReadTourCue(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(what|which|show|list|explain|summarize|tell|display|overview|describe|upcoming|scheduled|who(?:'s| is))\b/i.test(
      prompt,
    ) ||
    /\?\s*$/.test(prompt.trim()) ||
    /(ինչ|որ|որքան|ցույց|բացատր|ցուցադր|առաջիկա)/i.test(prompt) ||
    /(какие|какой|какая|покажи|объясни|список|предстоящ)/i.test(lower)
  );
}

function isConsumerTourExplainPrompt(prompt: string): boolean {
  if (
    /\b(one\s+departure|single\s+departure|one\s+(?:time\s+)?slot|day[-\s]?level|remaining\s+spots?|spots?\s+left|how\s+many\s+spots?|fully\s+booked|sold\s+out)\b/i.test(
      prompt,
    ) ||
    /(մեկ\s+մեկնում|մնաց|ամբողջությամբ\s+ամրագրված)/i.test(prompt) ||
    /(одно\s+время|осталось|недоступен)/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(booking\s+page|online\s+booking|this\s+page|on\s+this\s+page|per[-\s]?person|priced\s+per)\b/i.test(
      prompt,
    ) ||
    /(գրանցման\s+էջ|այս\s+էջ|անձի\s+համար)/i.test(prompt) ||
    /(страниц[а-яё]+\s+записи|указан\s+за\s+человек)/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\bcheckout\b/i.test(prompt) &&
    /(reject|won'?t|accept|fail|clamp|reduced|մերժեց|отклон|չի\s+ընդունում|не\s+принимает|уменьшил|նվազեցրեց)/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\bhow\s+many\s+days?\s+does\s+the\b/i.test(prompt) ||
    /\bhow\s+long\s+is\s+the\b/i.test(prompt) ||
    /\bis\s+.+\s+priced\s+per\s+person\b/i.test(prompt) ||
    (/\bwhat\s+is\s+the\s+max\s+group\s+size\s+for\b/i.test(prompt) &&
      /\b(?:booking\s+page|online\s+booking|this\s+page|on\s+this\s+page)\b/i.test(
        prompt,
      ))
  ) {
    return true;
  }
  if (
    /страниц[а-яё]+\s+записи/i.test(prompt) &&
    /(максимальн[а-яё]+\s+размер\s+групп|за\s+человек[а-яё]*)/i.test(prompt)
  ) {
    return true;
  }
  if (
    /сколько\s+дней\s+длится/i.test(prompt) &&
    !/\b(?:show|list|explain|summarize|our)\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

function hasTourExplainSurface(prompt: string): boolean {
  if (/(փաթեթ|пакет)/i.test(prompt) && !/(էքսկուրսիա|экскурс)/i.test(prompt)) {
    return false;
  }

  return (
    /\b(tour\s+services?|treks?|excursions?|group\s+sizes?|cover\s+images?|departures?|tour\s+bookings?|pax|guests?|max\s+group)\b/i.test(
      prompt,
    ) ||
    /\b(?:our\s+)?tours?\b/i.test(prompt) ||
    /(էքսկուրսիա|խումբ|ծածկ|առաջարկում|տուր.{0,20}ամրագր)/i.test(prompt) ||
    /(тур|экскурс|групп|обложк|выезд|pax|предлагаем)/i.test(prompt) ||
    /(тур|экскурс).{0,20}бронирован|бронирован.{0,20}(тур|экскурс)/i.test(
      prompt,
    )
  );
}

function isConfigureTourServicePromptCore(prompt: string): boolean {
  if (isMultiServiceSettingsPrompt(prompt)) return false;
  if (isBulkPricePrompt(prompt)) return false;
  if (isCreateNewServicePrompt(prompt)) return false;
  if (isApplyTourPlaybookPromptCore(prompt)) return false;
  if (!hasTourConfigureSurface(prompt)) return false;
  if (!isMutateTourConfigurePrompt(prompt)) return false;
  return true;
}

export function isExplainTourServicesPrompt(prompt: string): boolean {
  if (isDiagnoseTourCapacityPrompt(prompt)) return false;
  if (isExplainTourMeetingPointPrompt(prompt)) return false;
  if (isExplainPackageDisplayNamePrompt(prompt)) return false;
  if (isExplainTourBookingRecordPrompt(prompt)) return false;
  if (isExplainTourCalendarSpanPrompt(prompt)) return false;
  if (/(?:ինչ\s+է\s+իմ\s+հաջորդ|когда\s+моя\s+следующ)/iu.test(prompt)) {
    return false;
  }
  if (/\b(?:upcoming\s+)?tour\s+departures?\b/i.test(prompt)) return false;
  if (/\bdepartures?\s+by\s+(?:departure\s+)?date\b/i.test(prompt))
    return false;
  if (isConfigureTourServicePromptCore(prompt)) return false;
  if (isSingleTourBookingRecordExplainPrompt(prompt)) return false;
  if (isConsumerTourExplainPrompt(prompt)) return false;
  if (!hasTourExplainSurface(prompt)) return false;
  if (!hasReadTourCue(prompt)) return false;
  return true;
}

function isSingleTourBookingRecordExplainPrompt(prompt: string): boolean {
  if (
    /\b(upcoming|list|summarize)\b.{0,40}\b(tour\s+bookings?|departures?)\b/i.test(
      prompt,
    ) &&
    !/\bfor\s+(?:booking|appointment)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(booking\s+record|tourstartdate|tourenddate|special\s+requirements?)\b/i.test(
      prompt,
    ) ||
    (/\b(booking|appointment)\b/i.test(prompt) &&
      /\b(pax|tour\s+dates?|calendar\s+span|provider\s+calendar|metadata)\b/i.test(
        prompt,
      ))
  );
}

function extractDaysAhead(prompt: string): number | undefined {
  const match =
    prompt.match(/\bnext\s+(\d{1,3})\s+days?\b/i) ??
    prompt.match(/\b(\d{1,3})\s+days?\s+ahead\b/i) ??
    prompt.match(/\b(\d{1,3})\s+օր(?:ի|ում)?\s+հաջորդ/i) ??
    prompt.match(/(?:следующ(?:ие|их|ей))\s+(\d{1,3})\s+дн/i);
  const days = Number(match?.[1]);
  if (Number.isFinite(days) && days > 0) return Math.floor(days);
  if (/\bupcoming\s+week\b/i.test(prompt)) return 7;
  if (/\bthis\s+month\b/i.test(prompt)) return 30;
  return undefined;
}

function extractExplainServiceFilter(prompt: string): string | null {
  const patterns = [
    /\bmax\s+group\s+size\s+for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+)\s*\?/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)-ի\s+առավելագույն\s+խումբ/i,
    /максимальный\s+размер\s+группы\s+у\s+([A-Za-z0-9][\w\s&'-]+?)\s*\?/i,
    /\bsettings\s+for\s+([A-Za-z0-9][\w\s&'-]+)\s*$/i,
    /\bdoes\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+)\s+have\b/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+)\s+tour\s+settings\b/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+)\s*$/i,
    /\bon\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+)\s+tour\b/i,
    /\b([A-Za-z0-9][\w\s&'-]+)\s+tour\s+settings\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = normalizeServiceNameCandidate(match?.[1] ?? '');
    if (candidate) return candidate;
  }
  return null;
}

function resolveExplainSections(prompt: string): {
  includeServices: boolean;
  includeBookings: boolean;
} {
  const bookingsOnly =
    (/\bonly\s+(?:upcoming\s+)?(?:tour\s+)?bookings?\b/i.test(prompt) ||
      /\b(?:upcoming\s+)?(?:tour\s+)?bookings?\s+only\b/i.test(prompt)) &&
    !/\b(?:tour\s+)?services?\b/i.test(prompt) &&
    !/\bcover\b/i.test(prompt) &&
    !/\bgroup\s+sizes?\b/i.test(prompt);
  const servicesOnly =
    /\bonly\s+(?:tour\s+)?services?\b/i.test(prompt) ||
    /\b(?:tour\s+)?services?\s+only\b/i.test(prompt);

  return {
    includeServices: !bookingsOnly,
    includeBookings: !servicesOnly,
  };
}

export function parseExplainTourServicesFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainTourServices | null {
  if (!isExplainTourServicesPrompt(prompt)) return null;

  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const serviceNameFromParams =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const serviceName =
    serviceNameFromParams || extractExplainServiceFilter(prompt) || undefined;

  const daysAheadFromParams =
    typeof params.daysAhead === 'number'
      ? params.daysAhead
      : typeof params.daysAhead === 'string'
        ? Number(params.daysAhead)
        : undefined;
  const daysAhead =
    Number.isFinite(daysAheadFromParams) && daysAheadFromParams! > 0
      ? Math.floor(daysAheadFromParams!)
      : (extractDaysAhead(prompt) ?? 30);

  const sections = resolveExplainSections(prompt);

  return {
    serviceId,
    serviceName,
    daysAhead,
    includeServices: sections.includeServices,
    includeBookings: sections.includeBookings,
  };
}

export function rescueExplainTourServicesIntent(
  prompt: string,
  action: string,
): { action: 'explain_tour_services'; rescueReason: string } | null {
  if (isListUpcomingTourDeparturesPrompt(prompt)) return null;
  if (isExplainTourBookingRecordPrompt(prompt)) return null;
  if (isExplainTourCalendarSpanPrompt(prompt)) return null;
  if (isListTourCalendarWeekPrompt(prompt)) return null;
  if (action === 'explain_tour_booking_record') return null;
  if (action === 'explain_tour_calendar_span') return null;
  if (action === 'list_tour_calendar_week') return null;
  if (action === 'list_upcoming_tour_departures') return null;
  if ((TOUR_SERVICE_READ_INTENTS as readonly string[]).includes(action)) {
    return null;
  }
  if (action === 'apply_tour_playbook') return null;
  if (isApplyTourPlaybookPrompt(prompt)) return null;
  if (!parseExplainTourServicesFromPrompt(prompt)) return null;
  return {
    action: 'explain_tour_services',
    rescueReason: 'explain_tour_services',
  };
}

function isMultiServiceSettingsPrompt(prompt: string): boolean {
  return (
    /\b(max\s+service|multi[-\s]?service|service\s+count|services?\s+per\s+visit|same\s+visit)\b/i.test(
      prompt,
    ) || /\bmax(?:imum)?\s+\d+\s+services?\b/i.test(prompt)
  );
}

function isBulkPricePrompt(prompt: string): boolean {
  return (
    /\b(price|prices|percent|%|raise|lower|increase|decrease)\b/i.test(
      prompt,
    ) && /\b(all|every|massage|category|catalog)\b/i.test(prompt)
  );
}

function isCreateNewServicePrompt(prompt: string): boolean {
  return (
    /\b(add|create|new)\s+(?:a\s+)?(?:tour\s+)?service\b/i.test(prompt) &&
    !/\bfor\s+(?:the\s+)?[A-Za-z]/i.test(prompt)
  );
}

export function isConfigureTourServicePrompt(prompt: string): boolean {
  return (
    isConfigureTourServicePromptCore(prompt) &&
    !isExplainTourServicesPrompt(prompt)
  );
}

function normalizeDifficulty(
  value: string | undefined,
): TourDifficulty | undefined {
  if (!value) return undefined;
  const key = value.trim().toLowerCase();
  const mapped = DIFFICULTY_ALIASES[key];
  return mapped && isTourDifficulty(mapped) ? mapped : undefined;
}

function extractMaxGroupSize(prompt: string): number | undefined {
  const patterns = [
    /\bmax\s+group\s+size\b[\s\S]{0,80}?\bto\s+(\d{1,3})\b/i,
    /\bmax(?:imum)?\s+(\d{1,3})\s+(?:people|guests?|pax|persons?|participants?)\b/i,
    /\b(\d{1,3})\s+(?:people|guests?|pax)\s+(?:max|cap|limit)\b/i,
    /\bmax\s+group\s+(?:size\s+)?(?:of\s+|to\s+)?(\d{1,3})\b/i,
    /\bgroup\s+size\s+(?:of\s+|to\s+)?(\d{1,3})\b/i,
    /\b(\d{1,3})\s+person\s+cap\b/i,
    /\bwith\s+max\s+(\d{1,3})\s+people\b/i,
    /\bto\s+(\d{1,3})\s+guests?\b/i,
    /առավելագույն[\s\S]{0,40}?(\d{1,3})\s+հոգ/i,
    /(\d{1,3})\s+հոգու?/i,
    /էքսկուրսիա\s+(\d{1,3})\s+հոգ/i,
    /(\d{1,3})\s+հյուր/i,
    /максимум\s+(?:на\s+)?(\d{1,3})\s+человек/i,
    /(?:на\s+)?(\d{1,3})\s+человек(?:а|ов)?/i,
    /(?:до\s+)?(\d{1,3})\s+гост(?:ей|я)?/i,
    /на\s+(\d{1,3})\s+человек\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const size = Number(match?.[1]);
    if (Number.isFinite(size) && size > 0) return Math.floor(size);
  }
  return undefined;
}

function extractDifficulty(prompt: string): TourDifficulty | undefined {
  const patterns = [
    /\bdifficulty\s+(?:to\s+|as\s+)?(easy|moderate|challenging|hard|difficult)\b/i,
    /\b(easy|moderate|challenging|hard|difficult)\s+difficulty\b/i,
    /\bset\s+(?:the\s+)?(?:\w[\w\s'-]{0,40}?\s+)?difficulty\s+to\s+(easy|moderate|challenging|hard|difficult)\b/i,
    /\bchange\s+difficulty\s+(?:on|for)\b[\s\S]{0,60}?\bto\s+(easy|moderate|challenging|hard|difficult)\b/i,
    /\b(easy|moderate|challenging|hard|difficult)\b[\s\S]{0,40}?\bդժվարություն/i,
    /դարձրու\s+(easy|moderate|challenging|hard|difficult)\b/i,
    /сложност(?:ь|и)\s+(easy|moderate|challenging|hard|difficult)\b/i,
    /\b(easy|moderate|challenging|hard|difficult)\b[\s\S]{0,40}?\bдля\s+[A-Za-z]/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const difficulty = normalizeDifficulty(match?.[1]);
    if (difficulty) return difficulty;
  }
  if (isConfigureTourServicePromptCore(prompt)) {
    const inline = prompt.match(
      /\b(easy|moderate|challenging|hard|difficult)\b/i,
    );
    return normalizeDifficulty(inline?.[1]);
  }
  return undefined;
}

function extractDurationDays(prompt: string): number | undefined {
  const match =
    prompt.match(/\bduration\s+days?\s+(?:to\s+)?(\d{1,2})\b/i) ??
    prompt.match(/\b(\d{1,2})\s+day(?:s)?\s+(?:tour|trek|duration)\b/i) ??
    prompt.match(/տևողությունը\s+(\d{1,2})\s+օր/i) ??
    prompt.match(/(\d{1,2})\s+օր\b/i) ??
    prompt.match(/длительность\s+[^.]+\s+(\d{1,2})\s+дн/i) ??
    prompt.match(/(\d{1,2})\s+дн(?:я|ей)\b/i);
  const days = Number(match?.[1]);
  if (Number.isFinite(days) && days > 0) return Math.floor(days);
  return undefined;
}

function extractMeetingPoint(prompt: string): string | undefined {
  const match =
    prompt.match(/\bmeeting\s+point\s+for\s+[^.]+\s+to\s+(.+?)(?:\s*$|\.)/i) ??
    prompt.match(/հանդիպման\s+կետը[^՝]*՝\s*(.+?)(?:\s*$|\.)/i) ??
    prompt.match(/точку\s+встречи\s+[^.]+\s+на\s+(.+?)(?:\s*$|\.)/i);
  return match?.[1]?.trim() || undefined;
}

function extractIncludedItems(prompt: string): string | undefined {
  const match = prompt.match(
    /\bincluded\s+items?\s+for\s+[^.]+\s+to\s+(.+?)(?:\s*$|\.)/i,
  );
  return match?.[1]?.trim() || undefined;
}

function extractCoverImage(prompt: string): string | undefined {
  const quoted = prompt.match(
    /\bcover\s+image\s+for\s+[^.]+\s+to\s+["']([^"']+)["']/i,
  );
  if (quoted?.[1]) return quoted[1].trim();
  const bare = prompt.match(/\bcover\s+image\s+for\s+[^.]+\s+to\s+(\S+)/i);
  return bare?.[1]?.trim() || undefined;
}

function extractEnableTour(prompt: string): boolean | undefined {
  if (
    /\b(as\s+a\s+tour|enable\s+tour|tour\s+mode|turn\s+.+?\s+into\s+a\s+tour|make\s+.+?\s+a\s+tour)\b/i.test(
      prompt,
    ) ||
    /(-ը\s+էքսկուրսիա|որպես\s+էքսկուրսիա|էքսկուրսիայի\s+ռեժիմ|էքսկուրսիա\s+\d)/i.test(
      prompt,
    ) ||
    /(как\s+тур|тур-режим|туром\s+на)/i.test(prompt)
  ) {
    return true;
  }
  return undefined;
}

function normalizeServiceNameCandidate(candidate: string): string | null {
  let name = candidate.trim();
  for (let i = 0; i < 4; i += 1) {
    const next = name
      .replace(
        /^(?:mark|set|make|turn|update|change|enable|configure|put)\s+(?:the\s+)?/i,
        '',
      )
      .replace(/^(?:the|a|an)\s+/i, '')
      .trim();
    if (next === name) break;
    name = next;
  }
  name = name
    .replace(/^(?:easy|moderate|challenging|hard|difficult)\s+/i, '')
    .replace(/\s+with\s+max\b[\s\S]*$/i, '')
    .replace(/\s+with\s+\d+\s+person\b[\s\S]*$/i, '')
    .replace(/\s+to\s+(?:easy|moderate|challenging|hard)\b[\s\S]*$/i, '')
    .replace(/-ը$/i, '')
    .replace(/-ի$/i, '')
    .trim();
  return name.length >= 2 ? name : null;
}

function extractServiceNameFromPrompt(prompt: string): string | null {
  const patterns = [
    /\b([A-Za-z0-9][\w\s&'-]+?)-ը\s+որպես\s+էքսկուրսիա/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)-ի\s+հանդիպման/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)-ի\s+տևողություն/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)-ի\s+առավելագույն/i,
    /\b(?:easy|moderate|challenging|hard|difficult)\s+([A-Za-z0-9][\w\s&'-]+?)-ի\s+համար/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)-ի\s+համար/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)-ը\s+էքսկուրսիա/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+как\s+тур/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+туром\s+на/i,
    /точку\s+встречи\s+([A-Za-z0-9][\w\s&'-]+?)\s+на/i,
    /для\s+([A-Za-z0-9][\w\s&'-]+?)\s+на\s+\d/i,
    /(?:тур-режим\s+)?для\s+([A-Za-z0-9][\w\s&'-]+?)(?:\s*$|\.)/i,
    /длительность\s+([A-Za-z0-9][\w\s&'-]+?)\s+\d/i,
    /максимум\s+группы\s+([A-Za-z0-9][\w\s&'-]+?)\s+до/i,
    /\bmax\s+group\s+size\s+for\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+to\b/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+to\s+(?:\d|easy|moderate|challenging|Main|\/)/i,
    /\bfor\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)(?:\s*$|\.)/i,
    /\bon\s+([A-Za-z0-9][\w\s&'-]+?)\s+to\s+(?:\d|easy|moderate|challenging)\b/i,
    /\bon\s+([A-Za-z0-9][\w\s&'-]+?)(?:\s*$|\.)/i,
    /\bmake\s+(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+a\s+tour\b/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+as\s+a\s+tour\b/i,
    /\b([A-Za-z0-9][\w\s&'-]+?)\s+tour\s+difficulty\b/i,
    /\b(?:the\s+)?([A-Za-z0-9][\w\s&'-]+?)\s+difficulty\s+to\b/i,
    /\bfor\s+([A-Za-z0-9][\w\s&'-]+?)\s+to\b/i,
    /\btour\s+mode\s+for\s+([A-Za-z0-9][\w\s&'-]+?)(?:\s*$|\.)/i,
    /([A-Za-z0-9][\w\s&'-]+?)-ի\s+համար/i,
    /moderate\s+([A-Za-z0-9][\w\s&'-]+?)-ի/i,
    /moderate\s+для\s+([A-Za-z0-9][\w\s&'-]+?)(?:\s*$|\.)/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = normalizeServiceNameCandidate(match?.[1] ?? '');
    if (candidate) return candidate;
  }

  return null;
}

function hasTourFieldPatch(parsed: ParsedConfigureTourService): boolean {
  return (
    parsed.enableTour === true ||
    parsed.maxGroupSize !== undefined ||
    parsed.difficulty !== undefined ||
    parsed.coverImage !== undefined ||
    parsed.meetingPoint !== undefined ||
    parsed.includedItems !== undefined ||
    parsed.durationDays !== undefined
  );
}

export function parseConfigureTourServiceFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigureTourService | null {
  if (!isConfigureTourServicePrompt(prompt)) return null;

  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const serviceNameFromParams =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const serviceName =
    serviceNameFromParams || extractServiceNameFromPrompt(prompt) || undefined;

  const enableTour =
    params.enableTour === true ||
    params.serviceType === 'tour' ||
    extractEnableTour(prompt);

  const maxGroupSizeFromParams =
    typeof params.maxGroupSize === 'number'
      ? params.maxGroupSize
      : typeof params.maxGroupSize === 'string'
        ? Number(params.maxGroupSize)
        : undefined;
  const maxGroupSize =
    Number.isFinite(maxGroupSizeFromParams) && maxGroupSizeFromParams! > 0
      ? Math.floor(maxGroupSizeFromParams!)
      : extractMaxGroupSize(prompt);

  const difficultyFromParams = normalizeDifficulty(
    typeof params.difficulty === 'string' ? params.difficulty : undefined,
  );
  const difficulty = difficultyFromParams ?? extractDifficulty(prompt);

  const durationDaysFromParams =
    typeof params.durationDays === 'number'
      ? params.durationDays
      : typeof params.durationDays === 'string'
        ? Number(params.durationDays)
        : undefined;
  const durationDays =
    Number.isFinite(durationDaysFromParams) && durationDaysFromParams! > 0
      ? Math.floor(durationDaysFromParams!)
      : extractDurationDays(prompt);

  const meetingPoint =
    (typeof params.meetingPoint === 'string'
      ? params.meetingPoint.trim()
      : undefined) ?? extractMeetingPoint(prompt);

  const includedItems =
    (typeof params.includedItems === 'string'
      ? params.includedItems.trim()
      : undefined) ?? extractIncludedItems(prompt);

  const coverImage =
    (typeof params.coverImage === 'string'
      ? params.coverImage.trim()
      : undefined) ?? extractCoverImage(prompt);

  if (!serviceId && !serviceName) return null;

  const parsed: ParsedConfigureTourService = {
    serviceId,
    serviceName,
    ...(enableTour ? { enableTour: true } : {}),
    ...(maxGroupSize !== undefined ? { maxGroupSize } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(coverImage ? { coverImage } : {}),
    ...(meetingPoint ? { meetingPoint } : {}),
    ...(includedItems ? { includedItems } : {}),
    ...(durationDays !== undefined ? { durationDays } : {}),
  };

  if (!hasTourFieldPatch(parsed)) return null;

  return parsed;
}

function isGenericCatalogOrSchedulePrompt(prompt: string): boolean {
  return (
    /\bbulk\s+create\b/i.test(prompt) ||
    /\bcreate\s+category\b/i.test(prompt) ||
    /\bapply\s+schedule\b/i.test(prompt) ||
    (/\bapply\s+(?:the\s+)?template\b/i.test(prompt) &&
      /\b(employee|provider|staff|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(
        prompt,
      ))
  );
}

const APPLY_TOUR_PLAYBOOK_VERB =
  /\b(apply|set\s+up|load|seed|run|use|install)\b/i;

function isApplyTourPlaybookPromptCore(prompt: string): boolean {
  if (/\bapply\s+tour\s+playbook\b/i.test(prompt)) return true;

  if (
    /\b(tour\s+playbook|tour\s+vertical\s+playbook|vertical\s+tour\s+playbook)\b/i.test(
      prompt,
    ) &&
    APPLY_TOUR_PLAYBOOK_VERB.test(prompt)
  ) {
    return true;
  }

  if (
    /\btour\s+operator\b/i.test(prompt) &&
    /\b(playbook|starter|catalog|schedule|operating\s+hours|services?)\b/i.test(
      prompt,
    ) &&
    APPLY_TOUR_PLAYBOOK_VERB.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(seed|load)\s+(?:starter\s+)?tour\b/i.test(prompt) &&
    /\b(catalog|services?|schedule|8\s*[-:]\s*18|08:00|18:00|operating\s+hours)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(load|seed)\b/i.test(prompt) &&
    /\bstarter\b/i.test(prompt) &&
    /\btour\s+services?\b/i.test(prompt) &&
    /\b(schedule|operating)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\btour\s+business\b/i.test(prompt) &&
    /\btour\s+playbook\b/i.test(prompt) &&
    APPLY_TOUR_PLAYBOOK_VERB.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function isApplyTourPlaybookPrompt(prompt: string): boolean {
  if (isGenericCatalogOrSchedulePrompt(prompt)) return false;
  return isApplyTourPlaybookPromptCore(prompt);
}

export function parseApplyTourPlaybookFromPrompt(
  prompt: string,
): Record<string, never> | null {
  if (!isApplyTourPlaybookPrompt(prompt)) return null;
  return {};
}

export function rescueApplyTourPlaybookIntent(
  prompt: string,
  action: string,
): { action: 'apply_tour_playbook'; rescueReason: string } | null {
  if (action === 'apply_tour_playbook') return null;
  if (!parseApplyTourPlaybookFromPrompt(prompt)) return null;
  return {
    action: 'apply_tour_playbook',
    rescueReason: 'apply_tour_playbook',
  };
}

export function rescueConfigureTourServiceIntent(
  prompt: string,
  action: string,
): { action: 'configure_tour_service'; rescueReason: string } | null {
  if (action === 'configure_tour_service' || action === 'apply_tour_playbook') {
    return null;
  }
  if (!parseConfigureTourServiceFromPrompt(prompt)) return null;
  return {
    action: 'configure_tour_service',
    rescueReason: 'configure_tour_service',
  };
}
