const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

export function extractDaysFromPrompt(prompt: string): number | undefined {
  const lower = prompt.toLowerCase();

  const weekMatch = lower.match(
    /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+weeks?\b/,
  );
  if (weekMatch) {
    const n = Number.isNaN(Number(weekMatch[1]))
      ? NUMBER_WORDS[weekMatch[1]]
      : parseInt(weekMatch[1], 10);
    if (n) return Math.min(30, n * 7);
  }

  const dayMatch = lower.match(
    /\b(?:next|coming|following)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+days?\b/,
  );
  if (dayMatch) {
    const n = Number.isNaN(Number(dayMatch[1]))
      ? NUMBER_WORDS[dayMatch[1]]
      : parseInt(dayMatch[1], 10);
    if (n) return Math.min(30, n);
  }

  if (/\bthis\s+month\b/.test(lower)) return 30;
  if (/\bthis\s+week\b/.test(lower)) return 7;

  return undefined;
}

export function isListUpcomingBookingsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(?:what'?s|whats)\s+coming\s+up\b/.test(lower) ||
    /\bupcoming\s+bookings?\b/.test(lower) ||
    /\bwhat\s+do\s+i\s+have\s+coming\s+up\b/.test(lower)
  );
}

export function isGetScheduleSummaryPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\bsummarize\s+my\s+schedule\b/.test(lower) ||
    /\bschedule\s+overview\b/.test(lower) ||
    /\bhow\s+does\s+my\s+schedule\s+look\b/.test(lower)
  );
}

export function isGetCalendarMonthPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\bcalendar\s+(?:for|view)\b/.test(lower) ||
    /\bwhich\s+days?\s+this\s+month\b/.test(lower) ||
    /\bhow\s+(?:does|is)\s+(?:next\s+month|this\s+month)\b.{0,20}\bcalendar\b/.test(
      lower,
    ) ||
    /\bmonth\s+view\b/.test(lower)
  );
}

export function isListScheduleGapsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(?:fill|suggest|waitlist)\b/.test(lower)) return false;
  return (
    /\bwhich\s+days?\b.{0,20}\bgaps?\b/.test(lower) ||
    /\b(?:list|show)\b.{0,20}\b(?:schedule\s+)?gaps?\b/.test(lower) ||
    /\bopen\s+time\s+windows?\s+by\s+day\b/.test(lower)
  );
}

export function rescueProviderScheduleReadsIntent(
  prompt: string,
  action: string,
): {
  action:
    | 'list_upcoming_bookings'
    | 'get_schedule_summary'
    | 'get_calendar_month'
    | 'list_schedule_gaps';
  rescueReason: string;
} | null {
  if (
    action === 'list_upcoming_bookings' ||
    action === 'get_schedule_summary' ||
    action === 'get_calendar_month' ||
    action === 'list_schedule_gaps'
  )
    return null;
  if (isListUpcomingBookingsPrompt(prompt)) {
    return {
      action: 'list_upcoming_bookings',
      rescueReason: 'list_upcoming_bookings',
    };
  }
  if (isGetCalendarMonthPrompt(prompt)) {
    return {
      action: 'get_calendar_month',
      rescueReason: 'get_calendar_month',
    };
  }
  if (isListScheduleGapsPrompt(prompt)) {
    return {
      action: 'list_schedule_gaps',
      rescueReason: 'list_schedule_gaps',
    };
  }
  if (isGetScheduleSummaryPrompt(prompt)) {
    return {
      action: 'get_schedule_summary',
      rescueReason: 'get_schedule_summary',
    };
  }
  return null;
}
