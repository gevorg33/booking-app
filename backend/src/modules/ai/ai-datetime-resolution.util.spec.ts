/**
 * AI-ROADMAP Phase 4 — relative dates in the business timezone.
 *
 * The bug these exist for: "tomorrow" is currently computed as the UTC date of
 * `now + 24h`, which is a different day from the business's tomorrow whenever
 * UTC has rolled over and the business has not — i.e. the local evening.
 *
 * The existing test for it pins exactly one input, `2026-06-05T12:00:00Z`,
 * which is the one time of day where the defect cannot show. These use the
 * hours where it does.
 */
import {
  addCalendarDays,
  DATE_CONFIDENCE,
  localCalendarDate,
  resolveRelativeDate,
  resolveTomorrow,
  resolveTimeOfDay,
  TIME_CONFIDENCE,
  weekdayIndex,
} from './ai-datetime-resolution.util.js';
import { extractTimeSlotFromPrompt } from './ai-structural-extractors.js';

/** The buggy implementation, copied verbatim from ai-payments.util.ts. */
const legacyTomorrow = (now: Date): string =>
  new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

describe('localCalendarDate', () => {
  it('reads the local date, not the UTC one', () => {
    // 2026-06-05T01:00Z is still 2026-06-04 in New York.
    const now = new Date('2026-06-05T01:00:00Z');
    expect(localCalendarDate(now, 'America/New_York')).toBe('2026-06-04');
    expect(localCalendarDate(now, 'UTC')).toBe('2026-06-05');
  });

  it('handles zones ahead of UTC', () => {
    const now = new Date('2026-06-05T22:00:00Z');
    expect(localCalendarDate(now, 'Asia/Yerevan')).toBe('2026-06-06');
  });
});

describe('addCalendarDays', () => {
  it('adds calendar days, not 24-hour blocks', () => {
    expect(addCalendarDays('2026-06-05', 1)).toBe('2026-06-06');
    expect(addCalendarDays('2026-06-05', -1)).toBe('2026-06-04');
  });

  it('crosses month and year boundaries', () => {
    expect(addCalendarDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('is unaffected by DST, because it never touches wall-clock time', () => {
    // US spring-forward 2026-03-08: that local day is 23 hours long, so epoch
    // addition of 86,400,000ms would overshoot.
    expect(addCalendarDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addCalendarDays('2026-03-08', 1)).toBe('2026-03-09');
  });

  it('handles a leap day', () => {
    expect(addCalendarDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('weekdayIndex', () => {
  it('reports 0 for Sunday', () => {
    expect(weekdayIndex('2026-06-07')).toBe(0);
    expect(weekdayIndex('2026-06-05')).toBe(5); // Friday
  });
});

describe('resolveTomorrow — the bug', () => {
  const cases = [
    {
      tz: 'America/New_York',
      nowUtc: '2026-06-05T01:00:00Z',
      expected: '2026-06-05',
    },
    {
      tz: 'America/Los_Angeles',
      nowUtc: '2026-06-05T04:00:00Z',
      expected: '2026-06-05',
    },
    {
      tz: 'Asia/Yerevan',
      nowUtc: '2026-06-05T21:00:00Z',
      expected: '2026-06-07',
    },
  ];

  it.each(cases)(
    'resolves the local tomorrow in $tz where the legacy version does not',
    ({ tz, nowUtc, expected }) => {
      const now = new Date(nowUtc);
      expect(resolveTomorrow({ now, timeZone: tz })).toBe(expected);
      // ...and the shipped implementation disagrees, by a whole day.
      expect(legacyTomorrow(now)).not.toBe(expected);
    },
  );

  it('agrees with the legacy version at midday, which is why nobody noticed', () => {
    // The one input the existing test uses.
    const now = new Date('2026-06-05T12:00:00Z');
    expect(resolveTomorrow({ now, timeZone: 'America/New_York' })).toBe(
      legacyTomorrow(now),
    );
  });

  it('is never wrong across a full day of UTC hours', () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const now = new Date(Date.UTC(2026, 5, 5, hour));
      const local = localCalendarDate(now, 'America/Los_Angeles');
      expect(resolveTomorrow({ now, timeZone: 'America/Los_Angeles' })).toBe(
        addCalendarDays(local, 1),
      );
    }
  });
});

describe('resolveRelativeDate', () => {
  // Friday 2026-06-05, 3pm in New York.
  const ctx = {
    now: new Date('2026-06-05T19:00:00Z'),
    timeZone: 'America/New_York',
  };

  it('resolves an explicit ISO date at full confidence', () => {
    const r = resolveRelativeDate('book me on 2026-07-04', ctx);
    expect(r).toMatchObject({
      status: 'resolved',
      date: '2026-07-04',
      confidence: DATE_CONFIDENCE.explicit,
    });
  });

  it.each([
    ['today', '2026-06-05'],
    ['tonight', '2026-06-05'],
    ['tomorrow', '2026-06-06'],
    ['yesterday', '2026-06-04'],
    ['the day after tomorrow', '2026-06-07'],
  ])('resolves "%s" to %s', (phrase, expected) => {
    const r = resolveRelativeDate(phrase, ctx);
    expect(r.status).toBe('resolved');
    expect(r.date).toBe(expected);
  });

  it('prefers "day after tomorrow" over the "tomorrow" inside it', () => {
    expect(resolveRelativeDate('day after tomorrow', ctx).date).toBe(
      '2026-06-07',
    );
  });

  describe('weekday names', () => {
    it('resolves a forthcoming weekday', () => {
      // Friday the 5th → Monday is the 8th.
      const r = resolveRelativeDate('monday', ctx);
      expect(r.date).toBe('2026-06-08');
      expect(r.confidence).toBe(DATE_CONFIDENCE.bare_weekday);
    });

    it('adds a week for "next"', () => {
      expect(resolveRelativeDate('next monday', ctx).date).toBe('2026-06-15');
    });

    it('refuses a bare weekday that names today', () => {
      // "Friday" said on a Friday: today, or a week away? The date equivalent
      // of two customers named John.
      const r = resolveRelativeDate('friday', ctx);
      expect(r.status).toBe('ambiguous');
      expect(r.date).toBeNull();
      expect(r.alternatives).toEqual(['2026-06-05', '2026-06-12']);
      expect(r.clarification).toContain('next friday');
    });

    it('accepts "next friday" on a Friday, because the qualifier disambiguates', () => {
      const r = resolveRelativeDate('next friday', ctx);
      expect(r.status).toBe('resolved');
      expect(r.date).toBe('2026-06-12');
    });
  });

  describe('phrases that do not name a day', () => {
    it('offers the week rather than picking one for "next week"', () => {
      const r = resolveRelativeDate('sometime next week', ctx);
      expect(r.status).toBe('ambiguous');
      expect(r.alternatives).toHaveLength(7);
      expect(r.alternatives[0]).toBe('2026-06-08'); // the Monday
    });

    it('reports not_found for something it cannot interpret', () => {
      const r = resolveRelativeDate('whenever suits you', ctx);
      expect(r.status).toBe('not_found');
      expect(r.date).toBeNull();
      expect(r.clarification).toContain('whenever suits you');
    });

    it('reports not_found for an empty phrase', () => {
      expect(resolveRelativeDate('   ', ctx).status).toBe('not_found');
    });
  });

  it('never returns a date when status is not resolved', () => {
    for (const phrase of ['friday', 'next week', 'whenever', '']) {
      const r = resolveRelativeDate(phrase, ctx);
      if (r.status !== 'resolved') expect(r.date).toBeNull();
    }
  });
});

describe('the threshold option', () => {
  const ctx = {
    now: new Date('2026-06-05T19:00:00Z'),
    timeZone: 'America/New_York',
  };

  it('demotes a bare weekday when the caller wants more certainty', () => {
    // A caller writing to the calendar can demand more than one that is only
    // showing options. An option that never bit would be a lie.
    const relaxed = resolveRelativeDate('monday', ctx);
    const strict = resolveRelativeDate('monday', ctx, { threshold: 0.8 });
    expect(relaxed.status).toBe('resolved');
    expect(strict.status).toBe('not_found');
    expect(strict.alternatives).toEqual(['2026-06-08']);
    expect(strict.clarification).toBe('Did you mean 2026-06-08?');
  });

  it('still accepts anchored phrases at a high threshold', () => {
    expect(
      resolveRelativeDate('tomorrow', ctx, { threshold: 0.9 }).status,
    ).toBe('resolved');
  });
});

describe('resolveTimeOfDay', () => {
  /** The shipped extractor, whose rule ordering drops the meridiem. */
  const legacy = extractTimeSlotFromPrompt;

  describe('the space-before-meridiem bug (e2e-bug.364, now fixed)', () => {
    const cases: [string, string][] = [
      ['at 3:30 pm', '15:30'],
      ['9:30 pm', '21:30'],
      ['book for 6:45 p.m.', '18:45'],
      ['at 12:00 am', '00:00'],
    ];

    it.each(cases)(
      'resolves %s, and the legacy extractor now agrees',
      (phrase, expected) => {
        expect(resolveTimeOfDay(phrase).time).toBe(expected);
        // These originally asserted `not.toBe(expected)` — they pinned the bug's
        // existence as a contrast, and correctly failed the moment
        // `extractTimeSlotFromPrompt` was fixed. Now they assert agreement, so
        // the two paths cannot silently diverge again.
        expect(legacy(phrase)).toBe(expected);
      },
    );

    it('agrees with the legacy extractor when there is no space', () => {
      // "3:30pm" was always correct — the meridiem rule ran because there was
      // no word boundary before "p". A space was the whole difference.
      expect(resolveTimeOfDay('at 3:30pm').time).toBe('15:30');
      expect(legacy('at 3:30pm')).toBe('15:30');
    });
  });

  it.each([
    ['at 3pm', '15:00'],
    ['at 3 pm', '15:00'],
    ['at 11:45am', '11:45'],
    ['12pm', '12:00'],
    ['12am', '00:00'],
    ['at 14:30', '14:30'],
    ['at 00:15', '00:15'],
  ])('resolves %s to %s', (phrase, expected) => {
    expect(resolveTimeOfDay(phrase).time).toBe(expected);
  });

  describe('a bare hour is ambiguous, not assumed', () => {
    it('offers both readings of "at 8"', () => {
      const r = resolveTimeOfDay('book me at 8');
      expect(r.status).toBe('ambiguous');
      expect(r.time).toBeNull();
      expect(r.alternatives).toEqual(['08:00', '20:00']);
    });

    it('offers both readings of a 1–12 clock time', () => {
      expect(resolveTimeOfDay('at 10:30').alternatives).toEqual([
        '10:30',
        '22:30',
      ]);
    });

    it('treats 13–23 as unambiguous 24-hour', () => {
      const r = resolveTimeOfDay('at 19:00');
      expect(r.status).toBe('resolved');
      expect(r.confidence).toBe(TIME_CONFIDENCE.unambiguous);
    });
  });

  describe('business hours narrow rather than guess', () => {
    const hours = { openHour: 9, closeHour: 19 };

    it('picks the only reading the business is open for', () => {
      // 22:00 is after closing, so "at 10" can only be 10:00.
      const r = resolveTimeOfDay('at 10', { businessHours: hours });
      expect(r.status).toBe('resolved');
      expect(r.time).toBe('10:00');
      expect(r.confidence).toBe(TIME_CONFIDENCE.narrowed_by_hours);
    });

    it('stays ambiguous when the business is shut for both readings', () => {
      // 08:00 is before opening and 20:00 after closing. Neither is possible,
      // so business hours cannot break the tie — and inventing one would be
      // exactly the silent pick this layer exists to prevent.
      const r = resolveTimeOfDay('at 8', { businessHours: hours });
      expect(r.status).toBe('ambiguous');
      expect(r.alternatives).toEqual(['08:00', '20:00']);
    });

    it('stays ambiguous when both readings are open', () => {
      // 10:00 and 22:00... 22:00 is closed, so use a case where both fit.
      const r = resolveTimeOfDay('at 10', {
        businessHours: { openHour: 6, closeHour: 23 },
      });
      expect(r.status).toBe('ambiguous');
      expect(r.alternatives).toEqual(['10:00', '22:00']);
    });

    it('stays ambiguous when neither reading is open', () => {
      const r = resolveTimeOfDay('at 5', {
        businessHours: { openHour: 9, closeHour: 12 },
      });
      expect(r.status).toBe('ambiguous');
    });

    it('is overridden by an explicit meridiem', () => {
      // Business hours never override what the user actually said.
      const r = resolveTimeOfDay('at 8 pm', { businessHours: hours });
      expect(r.time).toBe('20:00');
    });
  });

  describe('rejects what it cannot read', () => {
    it.each(['', 'sometime', 'at 25:00', '13 pm', 'at 99'])(
      'reports not_found for %p',
      (phrase) => {
        const r = resolveTimeOfDay(phrase);
        expect(r.status).toBe('not_found');
        expect(r.time).toBeNull();
      },
    );
  });

  it('never returns a time unless resolved', () => {
    for (const phrase of ['at 8', 'sometime', '', 'at 10:30']) {
      const r = resolveTimeOfDay(phrase);
      if (r.status !== 'resolved') expect(r.time).toBeNull();
    }
  });
});
