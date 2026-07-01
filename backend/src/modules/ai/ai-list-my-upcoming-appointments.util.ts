import { resolveDateRange } from './ai-orchestration.helpers.js';
import {
  LIST_MY_UPCOMING_APPOINTMENTS_PROMPTS,
  type ListMyUpcomingAppointmentsScope,
} from './ai-list-my-upcoming-appointments.fixtures.js';

export const LIST_MY_UPCOMING_APPOINTMENTS_INTENTS = [
  'list_my_upcoming_appointments',
] as const;

export type ListMyUpcomingAppointmentsIntent =
  (typeof LIST_MY_UPCOMING_APPOINTMENTS_INTENTS)[number];

export interface ParsedListMyUpcomingAppointments {
  scope: ListMyUpcomingAppointmentsScope;
}

export { CUSTOMER_LIST_MY_UPCOMING_APPOINTMENTS_CLASSIFIER_RULES } from './ai-list-my-upcoming-appointments.fixtures.js';

const NEXT_CUE = new RegExp(
  String.raw`\b(?:what'?s|when\s+is|tell\s+me\s+about|show)\s+my\s+next\b|\bnext\s+(?:appointment|visit|booking)\b|\bmy\s+next\s+(?:appointment|visit|booking)\b|հաջորդ\s+(?:amr|ամրագր|այց)|следующ(?:ая|ий|ую)\s+(?:запись|визит)|когда\s+моя\s+следующ`,
  'iu',
);

const THIS_WEEK_CUE = new RegExp(
  String.raw`\b(?:this|the)\s+week\b|\bappointments?\s+this\s+week\b|\bany\s+appointments?\s+this\s+week\b|այս\s+շաբաթ|на\s+этой\s+неделе|записи\s+на\s+этой\s+неделе`,
  'iu',
);

const UPCOMING_CUE = new RegExp(
  String.raw`\b(?:upcoming|coming\s+up|future)\b.*\b(?:appointment|visit|booking)s?\b|\b(?:appointment|visit|booking)s?\b.*\b(?:upcoming|coming\s+up)\b|list\s+my\s+upcoming|առաջիկա\s+(?:amr|ամr|այց)|предстоящ(?:ие|ий|ую)|ближайш`,
  'iu',
);

const LIST_ALL_CUE = new RegExp(
  String.raw`\b(?:list|show\s+all|all\s+my)\b.*\b(?:appointments?|visits?|bookings?)\b(?!\s*(?:this\s+week|upcoming|coming\s+up|next))|\b(?:list|show)\s+my\s+appointments?\b(?!\s*(?:this\s+week|upcoming|coming\s+up))`,
  'iu',
);

const CONFIRM_SINGLE_CUE = new RegExp(
  String.raw`\b(?:what\s+time\s+is|summarize|who\s+is\s+my\s+appointment\s+with|what\s+did\s+i\s+just\s+book|confirm\s+my\s+booking)\b|ինչ\s+ժամի|ամփոփիր\s+իմ|ովի\s+հետ|подтверди\s+детали`,
  'iu',
);

const PACKAGE_VISITS_CUE = new RegExp(
  String.raw`\b(?:package\s+visits?|spa\s+day|package\s+bundle|my\s+package)\b`,
  'iu',
);

function matchUpcomingScenario(
  prompt: string,
): ListMyUpcomingAppointmentsIntent | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of LIST_MY_UPCOMING_APPOINTMENTS_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario.expectedAction;
    }
  }
  return null;
}

export function extractListMyUpcomingAppointmentsScopeFromPrompt(
  prompt: string,
): ListMyUpcomingAppointmentsScope {
  if (NEXT_CUE.test(prompt)) return 'next';
  if (THIS_WEEK_CUE.test(prompt)) return 'this_week';
  return 'all_upcoming';
}

export function isListMyUpcomingAppointmentsIntent(
  action: string,
): action is ListMyUpcomingAppointmentsIntent {
  return (LIST_MY_UPCOMING_APPOINTMENTS_INTENTS as readonly string[]).includes(
    action,
  );
}

const EXPLAIN_PROVIDER_AVAILABILITY_BLOCK = new RegExp(
  String.raw`\b(?:is|are)\s+[A-Za-z][\w.'-]{1,30}\s+(?:working|in|on\s+duty|scheduled)\b|\bwho\s+has\s+openings?\b|\b(?:who|which)\s+(?:stylist|specialist|provider|therapist|staff|master)s?\s+(?:has|have|is|are)\s+(?:openings?|available|working|free)\b|\bwhich\s+providers?\s+have\s+openings?\b`,
  'iu',
);

export function isListMyUpcomingAppointmentsPrompt(prompt: string): boolean {
  if (EXPLAIN_PROVIDER_AVAILABILITY_BLOCK.test(prompt)) return false;
  if (PACKAGE_VISITS_CUE.test(prompt)) return false;
  if (CONFIRM_SINGLE_CUE.test(prompt)) return false;
  if (/\bcancel\b/i.test(prompt)) return false;
  if (
    /\bwho\s+is\s+free\b/i.test(prompt) &&
    /\b(?:massage|facial|manicure|pedicure|haircut|color|blowdry|peel|beard|trim)\b/i.test(
      prompt,
    ) &&
    /\band\b/i.test(prompt)
  ) {
    return false;
  }

  if (matchUpcomingScenario(prompt)) return true;

  if (
    /(?:ինչ\s+է\s+իմ\s+հաջորդ|amragrумner\s+ays\s+shabat|tsuyts\s+tu(?:r|ր)\s+im\s+arajik|когда\s+моя\s+следующ|записи\s+на\s+этой\s+неделе|покажи\s+мои\s+предстоящ)/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    NEXT_CUE.test(prompt) ||
    THIS_WEEK_CUE.test(prompt) ||
    UPCOMING_CUE.test(prompt)
  ) {
    return true;
  }

  if (
    /\bupcoming\b.*(?:այց|amr|amragr)/iu.test(prompt) ||
    /(?:ինչ|tsuyts).*\bupcoming\b/iu.test(prompt)
  ) {
    return true;
  }

  if (LIST_ALL_CUE.test(prompt)) return false;

  return false;
}

export function parseListMyUpcomingAppointmentsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedListMyUpcomingAppointments | null {
  if (!isListMyUpcomingAppointmentsPrompt(prompt)) return null;

  const scopeFromParams =
    typeof params.scope === 'string' &&
    ['next', 'this_week', 'all_upcoming'].includes(params.scope)
      ? (params.scope as ListMyUpcomingAppointmentsScope)
      : undefined;

  return {
    scope:
      scopeFromParams ??
      extractListMyUpcomingAppointmentsScopeFromPrompt(prompt),
  };
}

export function rescueListMyUpcomingAppointmentsIntent(
  prompt: string,
  action: string,
): { action: ListMyUpcomingAppointmentsIntent; rescueReason: string } | null {
  if (isListMyUpcomingAppointmentsIntent(action)) return null;
  if (!parseListMyUpcomingAppointmentsFromPrompt(prompt)) return null;
  return {
    action: 'list_my_upcoming_appointments',
    rescueReason: 'list_upcoming_appointments',
  };
}

export function filterUpcomingBookingsForScope<
  T extends { startTime: string; status: string },
>(
  bookings: T[],
  scope: ListMyUpcomingAppointmentsScope,
  prompt: string,
  timeZone = 'UTC',
  now = new Date(),
): T[] {
  const upcoming = bookings
    .filter(
      (booking) =>
        String(booking.status).toLowerCase() === 'confirmed' &&
        new Date(booking.startTime).getTime() >= now.getTime(),
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (scope === 'next') {
    return upcoming.slice(0, 1);
  }

  if (scope === 'this_week') {
    const range = resolveDateRange({ _timeZone: timeZone }, prompt, timeZone);
    if (!range) return upcoming;
    return upcoming.filter((booking) => {
      const day = booking.startTime.slice(0, 10);
      return day >= range.start && day <= range.end;
    });
  }

  return upcoming;
}
