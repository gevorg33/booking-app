import type { TimeOfDayWindow } from './ai-operations.util.js';

/**
 * JS \\b only treats [A-Za-z0-9_] as word chars — Armenian/Cyrillic need plain
 * substring patterns (distinctive enough for these operational phrases).
 */

/** Armenian / Russian / translit "who" tokens. */
const MULTILINGUAL_WHO = /(?:ով|кто|\bkto\b)/iu;

/** Free / available / open in hy/ru/translit. */
export const MULTILINGUAL_PROVIDER_AVAILABILITY =
  /(?:ազատ|հասանելի|բաց|свобод\w*|доступн\w*|\bazat\b|svobod\w*|\bdostupn\w*)/iu;

/** Book / reserve verbs in hy/ru/translit. */
export const MULTILINGUAL_BOOK_VERBS =
  /(?:ամրագրիր|запиши|забронируй|\bamsagrum\b|\bzabroniruy\b|\bzapis\b)/iu;

/** Nearest / soonest / first-available slot phrasing. */
export const MULTILINGUAL_FLEXIBLE_SLOT =
  /(?:մոտակա|ամենամոտ|ամենաառաջին|ближайш\w*|скорейш\w*|первый\s+свободн|blizhaysh\w*|\bskoreysh\b|perviy\s+svobodn|\basap\b)/iu;

/** Slot / appointment / time nouns (Latin + Cyrillic). */
const MULTILINGUAL_SLOT_NOUNS =
  /(?:\b(?:slot|appointment|opening|time)\b|слот|запись|время|ամրագրում)/iu;

/** Relative tomorrow in hy/ru/translit. */
export const MULTILINGUAL_TOMORROW =
  /(?:վաղը|վաղա|завтра|\bvagh@?\b|\bzavtra\b)/iu;

const MULTILINGUAL_MORNING =
  /(?:առավոտ|утр[оа]?м|утром|\butrom\b|\baravot\b)/iu;
const MULTILINGUAL_AFTERNOON = /(?:ցերեկ|дн[её]м|\bdnyom\b|\btserek\b)/iu;
const MULTILINGUAL_EVENING =
  /(?:երեկոյան|երեկո|вечером|вечер|\bvecherom\b|\bvecher\b|\berek\b)/iu;

/** Provider-role words when paired with availability (hy/ru). */
const MULTILINGUAL_PROVIDER_ROLE =
  /(?:մասնագետ|специалист|мастер|\bproviders?\b|\bstylists?\b|\bspecialists?\b)/iu;

const MULTILINGUAL_SERVICE_HINT =
  /(?:\b(?:massage|haircut|facial|lashes|lips|service)\b|массаж(?:а|у|е|и)?|стрижк(?:а|и|у|е)?)/iu;

export function promptMentionsMultilingualTomorrow(prompt: string): boolean {
  return MULTILINGUAL_TOMORROW.test(prompt);
}

/** Parse morning/afternoon/evening from hy/ru/translit when English parse misses. */
export function parseMultilingualTimeOfDayWindow(
  prompt: string,
  params: Record<string, unknown>,
): TimeOfDayWindow | null {
  const raw = params.timeOfDay ?? params.dayPart;
  if (typeof raw === 'string') {
    const lower = raw.toLowerCase();
    if (lower === 'morning' || lower === 'afternoon' || lower === 'evening') {
      return lower;
    }
  }
  if (MULTILINGUAL_MORNING.test(prompt)) return 'morning';
  if (MULTILINGUAL_AFTERNOON.test(prompt)) return 'afternoon';
  if (MULTILINGUAL_EVENING.test(prompt)) return 'evening';
  return null;
}

/** Who-is-free / provider availability phrasing in Armenian, Russian, or translit. */
export function isMultilingualCheckProvidersPrompt(prompt: string): boolean {
  if (/\bpackages?\b/i.test(prompt)) return false;
  if (/\b(membership|subscription)\s+plans?\b/i.test(prompt)) return false;

  if (
    MULTILINGUAL_WHO.test(prompt) &&
    MULTILINGUAL_PROVIDER_AVAILABILITY.test(prompt)
  ) {
    return true;
  }
  if (
    MULTILINGUAL_PROVIDER_AVAILABILITY.test(prompt) &&
    MULTILINGUAL_PROVIDER_ROLE.test(prompt)
  ) {
    return true;
  }
  return false;
}

/** Book-nearest / flexible-slot phrasing in Armenian, Russian, or translit. */
export function isMultilingualBookNearestPrompt(prompt: string): boolean {
  const wantsFlexible = MULTILINGUAL_FLEXIBLE_SLOT.test(prompt);
  if (!wantsFlexible) return false;

  return (
    MULTILINGUAL_BOOK_VERBS.test(prompt) ||
    /\b(find|get|reserve|schedule|grab)\b/i.test(prompt) ||
    MULTILINGUAL_SLOT_NOUNS.test(prompt) ||
    MULTILINGUAL_SERVICE_HINT.test(prompt)
  );
}

/** First-available flexible booking in hy/ru/translit (rescue + enrichment). */
export function isMultilingualFirstAvailableBookingPrompt(
  prompt: string,
): boolean {
  if (!MULTILINGUAL_FLEXIBLE_SLOT.test(prompt)) return false;
  return (
    MULTILINGUAL_BOOK_VERBS.test(prompt) ||
    /\b(find|get|reserve|schedule|grab)\b/i.test(prompt) ||
    MULTILINGUAL_SLOT_NOUNS.test(prompt) ||
    MULTILINGUAL_SERVICE_HINT.test(prompt)
  );
}

/** Latin catalog names embedded in hy/ru prompts (e.g. permanent lashes-ի համար). */
export function extractMultilingualServiceNameFromPrompt(
  prompt: string,
): string | null {
  const hyFor = prompt.match(/([A-Za-z][\w\s'-]{1,40}?)(?:-ի\s+համար|-ը\b)/u);
  if (hyFor) return hyFor[1].trim();
  const ruFor = prompt.match(
    /для\s+([A-Za-z][\w\s'-]{1,40}?)(?=\s*(?:,|;|\?|запиши|забронируй|$))/iu,
  );
  if (ruFor) return ruFor[1].trim().replace(/[,.]$/, '');
  const translitDlya = prompt.match(
    /\bdlya\s+([a-z][\w\s'-]{1,40}?)(?=\s*(?:,|;|\?|zabroniruy|zapis|$))/i,
  );
  if (translitDlya) return translitDlya[1].trim();
  if (/массаж(?:а|у|е|и)?/iu.test(prompt)) return 'massage';
  return null;
}
