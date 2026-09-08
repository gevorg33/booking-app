/**
 * AI-ROADMAP Phase 4 — relative dates resolved in the business timezone.
 *
 * The other half of the resolution layer. Entity resolution (§29) fixed "which
 * John"; this fixes "which day", which is broken in a way that is easier to
 * demonstrate and harder to notice.
 *
 * The implementation this replaced, once duplicated verbatim in
 * `ai-payments.util.ts` and `ai-compound-booking-context.util.ts`:
 *
 * ```ts
 * new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
 * ```
 *
 * **Both copies were fixed and are now gone** — §185 hoisted the one survivor
 * here, where the calendar primitives it needs already live. This paragraph is
 * kept in the past tense rather than deleted, because the bug it describes is
 * the reason the two design rules below exist.
 *
 * It took the **UTC** date of a moment 24 hours from now, which is not
 * "tomorrow" in the business's timezone whenever UTC has already rolled over
 * and the business has not. That is the local evening — prime booking time —
 * and it is wrong for 4 of 24 hours in New York, 7 of 24 in Los Angeles, and
 * 4 of 24 even in Yerevan. A customer booking "tomorrow evening" at 9pm gets
 * booked two days out.
 *
 * Two design rules follow:
 *
 * 1. **All arithmetic is calendar arithmetic on the local date**, never epoch
 *    addition. Adding 86,400,000ms is not adding a day across a DST boundary.
 * 2. **A verdict, not a string** — same shape as entity resolution, because
 *    "Friday" said on a Friday is genuinely ambiguous and silently picking one
 *    is the same sin as picking one of two Johns.
 */

export type DateResolutionStatus = 'resolved' | 'ambiguous' | 'not_found';

export interface DateResolution {
  status: DateResolutionStatus;
  /** `YYYY-MM-DD` in the business timezone. Null unless resolved. */
  date: string | null;
  confidence: number;
  /** Candidate dates when ambiguous, so the caller can offer them. */
  alternatives: string[];
  clarification: string | null;
}

export interface DateResolutionContext {
  now: Date;
  /** IANA zone. The whole point — resolution is meaningless without it. */
  timeZone: string;
}

/** Confidence by how explicit the phrase was. */
export const DATE_CONFIDENCE = {
  /** An ISO date needs no interpretation. */
  explicit: 1,
  /** "today", "tomorrow", "yesterday" — one meaning each. */
  anchored: 0.95,
  /** "next Friday" — the qualifier removes the ambiguity. */
  qualified_weekday: 0.9,
  /** A bare weekday name, when today is not that weekday. */
  bare_weekday: 0.75,
} as const;

export const DEFAULT_DATE_THRESHOLD = 0.7;

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/**
 * The local calendar date at `now`, as `YYYY-MM-DD`.
 *
 * Uses `formatToParts` rather than a locale whose format happens to be
 * ISO-shaped, so this does not depend on ICU giving `en-CA` a particular
 * pattern.
 */
export function localCalendarDate(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Add days to a calendar date.
 *
 * Done on the date parts via `Date.UTC`, which has no DST, so "one day later"
 * means the next calendar day even across a transition. Epoch addition does
 * not: on a spring-forward day, `+86400000ms` is 25 local hours.
 */
export function addCalendarDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d) + days * 86_400_000);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Tomorrow's calendar date in the business timezone — §185 (e2e-bug.367 / B7).
 *
 * Lives here because `localCalendarDate` and `addCalendarDays` do: it is one
 * line of composition over them, and hosting it anywhere else is what produced
 * two copies. `ai-payments.util.ts` and `ai-compound-booking-context.util.ts`
 * import each other, so neither could own it without deepening a cycle that
 * already exists.
 *
 * Both former copies were byte-identical and both already correct — unlike the
 * `extractTimeSlotFromPrompt` pair in §184, this was redundancy rather than
 * divergence. Hoisting it removes the chance of the next fix landing in one and
 * not the other.
 */
export function resolveTomorrowDateKey(
  timeZone: string,
  now: Date = new Date(),
): string {
  return addCalendarDays(localCalendarDate(now, timeZone), 1);
}

/** 0 = Sunday, matching `WEEKDAYS`. */
export function weekdayIndex(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const ISO_DATE = /\b(\d{4}-\d{2}-\d{2})\b/;

/**
 * A resolved date, demoted to `not_found` when it does not clear the caller's
 * bar. A caller that raises the threshold is saying "only act on phrasings you
 * are more sure about than this" — the date equivalent of the entity
 * resolver's threshold, and it has to actually bite or the option is a lie.
 */
function resolved(
  date: string,
  confidence: number,
  threshold: number,
): DateResolution {
  if (confidence < threshold) {
    return {
      status: 'not_found',
      date: null,
      confidence,
      alternatives: [date],
      clarification: `Did you mean ${date}?`,
    };
  }
  return {
    status: 'resolved',
    date,
    confidence,
    alternatives: [],
    clarification: null,
  };
}

/**
 * Resolve a date phrase against the business's local calendar.
 *
 * Recognises only phrases with a single defensible meaning. Anything vaguer
 * ("next week", "soon", "in a bit") returns `ambiguous` or `not_found` rather
 * than a guess — §7 working agreement 5.
 */
export function resolveRelativeDate(
  phrase: string,
  context: DateResolutionContext,
  options: { threshold?: number } = {},
): DateResolution {
  const threshold = options.threshold ?? DEFAULT_DATE_THRESHOLD;
  const text = phrase.toLowerCase().trim();
  const today = localCalendarDate(context.now, context.timeZone);

  if (!text) {
    return {
      status: 'not_found',
      date: null,
      confidence: 0,
      alternatives: [],
      clarification: 'Which date did you mean?',
    };
  }

  const iso = ISO_DATE.exec(text);
  if (iso) return resolved(iso[1], DATE_CONFIDENCE.explicit, threshold);

  if (/\bday after tomorrow\b/.test(text)) {
    return resolved(
      addCalendarDays(today, 2),
      DATE_CONFIDENCE.anchored,
      threshold,
    );
  }
  if (/\btomorrow\b/.test(text)) {
    return resolved(
      addCalendarDays(today, 1),
      DATE_CONFIDENCE.anchored,
      threshold,
    );
  }
  if (/\byesterday\b/.test(text)) {
    return resolved(
      addCalendarDays(today, -1),
      DATE_CONFIDENCE.anchored,
      threshold,
    );
  }
  if (
    /\b(today|tonight|this evening|this morning|this afternoon)\b/.test(text)
  ) {
    return resolved(today, DATE_CONFIDENCE.anchored, threshold);
  }

  const weekdayMatch = WEEKDAYS.find((day) =>
    new RegExp(`\\b${day}\\b`).test(text),
  );
  if (weekdayMatch) {
    const target = WEEKDAYS.indexOf(weekdayMatch);
    const current = weekdayIndex(today);
    const explicitlyNext = /\bnext\b/.test(text);

    let delta = (target - current + 7) % 7;
    if (delta === 0) {
      // The phrase names today's weekday. "Friday" said on a Friday means
      // either today or a week away, and the platform cannot tell which —
      // this is the date equivalent of two customers named John.
      if (explicitlyNext)
        return resolved(
          addCalendarDays(today, 7),
          DATE_CONFIDENCE.qualified_weekday,
          threshold,
        );
      const alternatives = [today, addCalendarDays(today, 7)];
      return {
        status: 'ambiguous',
        date: null,
        confidence: DATE_CONFIDENCE.bare_weekday,
        alternatives,
        clarification: `Did you mean today (${alternatives[0]}) or next ${weekdayMatch} (${alternatives[1]})?`,
      };
    }
    if (explicitlyNext) delta += 7;

    return resolved(
      addCalendarDays(today, delta),
      explicitlyNext
        ? DATE_CONFIDENCE.qualified_weekday
        : DATE_CONFIDENCE.bare_weekday,
      threshold,
    );
  }

  // "next week" names a week, not a day. Offering the week's days is more
  // useful than refusing outright, but picking one would be a guess.
  if (/\bnext week\b/.test(text)) {
    const monday = addCalendarDays(today, (8 - weekdayIndex(today)) % 7 || 7);
    return {
      status: 'ambiguous',
      date: null,
      confidence: 0.4,
      alternatives: Array.from({ length: 7 }, (_, i) =>
        addCalendarDays(monday, i),
      ),
      clarification: 'Which day next week did you mean?',
    };
  }

  return {
    status: 'not_found',
    date: null,
    confidence: 0,
    alternatives: [],
    clarification: `I couldn't work out which date "${phrase.trim()}" means.`,
  };
}

/** Convenience for the commonest case, resolved correctly. */
export function resolveTomorrow(context: DateResolutionContext): string {
  return addCalendarDays(localCalendarDate(context.now, context.timeZone), 1);
}

// ---------------------------------------------------------------------------
// Time of day
// ---------------------------------------------------------------------------

/**
 * The existing `extractTimeSlotFromPrompt` (`ai-structural-extractors.ts`) tries
 * a bare `HH:MM` pattern **before** its am/pm pattern. `\b(\d{1,2}):(\d{2})\b`
 * matches "3:30" inside "3:30 pm" — the word boundary is satisfied by the space
 * — and returns immediately, so the meridiem is never read:
 *
 *   "at 3:30pm"        → 15:30   (no boundary before "p", so am/pm rule runs)
 *   "at 3:30 pm"       → 03:30   ← twelve hours early
 *   "book for 6:45 p.m." → 06:45 ← twelve hours early
 *   "at 12:00 am"      → 12:00   ← noon instead of midnight
 *
 * So a space decides whether a PM booking is correct. This resolver reads the
 * meridiem first, and treats a bare 1–12 hour as ambiguous rather than assuming.
 */
export interface TimeResolution {
  status: DateResolutionStatus;
  /** `HH:MM`, 24-hour. Null unless resolved. */
  time: string | null;
  confidence: number;
  alternatives: string[];
  clarification: string | null;
}

export const TIME_CONFIDENCE = {
  /** An explicit meridiem, or an hour that can only be 24-hour (13–23). */
  unambiguous: 0.95,
  /** A bare 1–12 hour narrowed to one option by business hours. */
  narrowed_by_hours: 0.8,
} as const;

/** `H:M` → `HH:MM`, or null when out of range. */
function pad24(hour: number, minute: number): string | null {
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function applyMeridiem(hour: number, meridiem: string): number {
  const isPm = /^p/i.test(meridiem.trim());
  if (isPm) return hour === 12 ? 12 : hour + 12;
  return hour === 12 ? 0 : hour;
}

export interface TimeResolutionOptions {
  /**
   * Local opening hours, used to narrow a bare 1–12 hour. This is a real
   * constraint rather than a guess: if the business opens at 09:00 and closes
   * at 19:00, "at 8" can only be 20:00 if they are shut, so 08:00 wins.
   */
  businessHours?: { openHour: number; closeHour: number };
}

/**
 * The one meridiem pattern. A single capturing group, so callers can splice it
 * into a larger regex without disturbing their group numbering.
 *
 * Two things here are load-bearing, and both are e2e-bug.364 — which has now
 * been rediscovered in four separate hand-written copies of this alternation:
 *
 * 1. The dots are optional *individually* (`a\.?m\.?`), so `a.m.`, `a.m`, `am.`
 *    and `am` all match. Copies that spelled the alternation out as
 *    `am|pm|a\.m\.|p\.m\.` missed `p.m` — and because `a.m` coincidentally
 *    falls through to the same value as its 24-hour reading, only the p.m.
 *    forms ever revealed it.
 * 2. It ends with `(?!\w)`, never `\b`. A word boundary needs a word character
 *    on one side and `p.m.` ends in a period, so `\b` can never match the
 *    dotted form at all. Every copy that used `\b` silently fell through to a
 *    24-hour reading: "reschedule to 6:45 p.m." booked 06:45.
 *
 * Ordering no longer matters (it did when the dots were spelled out, because
 * `am` would match the "a" of "a.m." and leave the dots dangling), but keep the
 * group single and self-contained so splicing stays safe.
 */
export const MERIDIEM_GROUP_SOURCE = String.raw`(a\.?m\.?|p\.?m\.?)(?!\w)`;

export function resolveTimeOfDay(
  phrase: string,
  options: TimeResolutionOptions = {},
): TimeResolution {
  const text = phrase.toLowerCase().trim();
  const notFound = (message: string): TimeResolution => ({
    status: 'not_found',
    time: null,
    confidence: 0,
    alternatives: [],
    clarification: message,
  });

  if (!text) return notFound('What time did you mean?');

  // Meridiem first — the whole point. Optional whitespace, optional dots.
  const withMeridiem = text.match(
    new RegExp(
      String.raw`\b(\d{1,2})(?::(\d{2}))?\s*` + MERIDIEM_GROUP_SOURCE,
      'i',
    ),
  );
  if (withMeridiem) {
    const hour12 = Number(withMeridiem[1]);
    const minute = withMeridiem[2] ? Number(withMeridiem[2]) : 0;
    if (hour12 >= 1 && hour12 <= 12) {
      const time = pad24(applyMeridiem(hour12, withMeridiem[3]), minute);
      if (time) {
        return {
          status: 'resolved',
          time,
          confidence: TIME_CONFIDENCE.unambiguous,
          alternatives: [],
          clarification: null,
        };
      }
    }
    return notFound(`"${phrase.trim()}" isn't a time I can read.`);
  }

  const clock = text.match(/\b(\d{1,2}):(\d{2})\b/);
  const bareHour = clock
    ? null
    : text.match(/\b(?:at|@)\s*(\d{1,2})\b(?!\s*:)/);
  if (!clock && !bareHour) {
    return notFound(`I couldn't find a time in "${phrase.trim()}".`);
  }

  const hour = Number(clock ? clock[1] : bareHour![1]);
  const minute = clock && clock[2] ? Number(clock[2]) : 0;

  // 0 and 13–23 can only be 24-hour; there is nothing to disambiguate.
  if (hour === 0 || (hour >= 13 && hour <= 23)) {
    const time = pad24(hour, minute);
    return time
      ? {
          status: 'resolved',
          time,
          confidence: TIME_CONFIDENCE.unambiguous,
          alternatives: [],
          clarification: null,
        }
      : notFound(`"${phrase.trim()}" isn't a valid time.`);
  }

  if (hour < 1 || hour > 12) {
    return notFound(`"${phrase.trim()}" isn't a valid time.`);
  }

  const morning = pad24(hour === 12 ? 0 : hour, minute);
  const evening = pad24(hour === 12 ? 12 : hour + 12, minute);
  if (!morning || !evening) {
    return notFound(`"${phrase.trim()}" isn't a valid time.`);
  }

  const hours = options.businessHours;
  if (hours) {
    const within = [morning, evening].filter((t) => {
      const h = Number(t.slice(0, 2));
      return h >= hours.openHour && h < hours.closeHour;
    });
    if (within.length === 1) {
      return {
        status: 'resolved',
        time: within[0],
        confidence: TIME_CONFIDENCE.narrowed_by_hours,
        alternatives: [],
        clarification: null,
      };
    }
  }

  return {
    status: 'ambiguous',
    time: null,
    confidence: 0.5,
    alternatives: [morning, evening],
    clarification: `Did you mean ${morning} or ${evening}?`,
  };
}
