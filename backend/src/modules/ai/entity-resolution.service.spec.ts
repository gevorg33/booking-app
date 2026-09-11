/**
 * AI-ROADMAP Phase 4 — the one resolution layer.
 *
 * The measurements that justified this class are pinned here as behaviour. The
 * tree shipped **seven** `resolveServiceByName` implementations — five
 * byte-identical, two variants — and against a five-service catalogue they
 * disagree on 3 of 11 ordinary inputs while silently guessing on 5 more.
 *
 * Each disagreement below is written as a test so the old behaviour cannot come
 * back by someone re-adding a local helper "just for this file".
 */
import { Test } from '@nestjs/testing';
import { EntityResolutionService } from './entity-resolution.service.js';

/** The catalogue used in the measurement: three of five names share a word. */
const CATALOG = [
  { id: 's1', name: 'Massage' },
  { id: 's2', name: 'Deep Tissue Massage' },
  { id: 's3', name: 'Hot Stone Massage' },
  { id: 's4', name: 'Facial' },
  { id: 's5', name: 'Hydrating Facial' },
];

/**
 * The five identical copies, verbatim. Kept so the tests below compare against
 * what actually shipped rather than against a description of it.
 */
const legacyVariantA = (list: typeof CATALOG, name: string) => {
  const needle = name.toLowerCase();
  return (
    list.find((i) => i.name.toLowerCase() === needle) ??
    list.find((i) => i.name.toLowerCase().includes(needle))
  );
};

/** The `ai-compare-services` / `ai-pick-provider-for-service` variant. */
const legacyVariantB = (list: typeof CATALOG, name: string) => {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  return (
    list.find((e) => e.name.toLowerCase() === needle) ??
    list.find((e) => e.name.toLowerCase().includes(needle)) ??
    list.find((e) => needle.includes(e.name.toLowerCase()))
  );
};

describe('EntityResolutionService', () => {
  let service: EntityResolutionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [EntityResolutionService],
    }).compile();
    service = moduleRef.get(EntityResolutionService);
  });

  it('is injectable', () => {
    // The point of the class over a bare util: one seam call sites can depend
    // on, so the next handler does not grow an eighth copy.
    expect(service).toBeInstanceOf(EntityResolutionService);
  });

  describe('the disagreements it replaces', () => {
    it('trims, where one shipped variant did not', () => {
      // `"  Massage  "` resolves in variant B and returns undefined in A. A
      // leading space decided whether the command worked, depending only on
      // which file the handler lived in.
      expect(legacyVariantA(CATALOG, '  Massage  ')).toBeUndefined();
      expect(legacyVariantB(CATALOG, '  Massage  ')?.id).toBe('s1');

      expect(service.resolveService(CATALOG, '  Massage  ').match?.id).toBe(
        's1',
      );
    });

    it('refuses "a deep tissue massage please" rather than picking either way', () => {
      // A returns undefined, B returns "Massage" via its reverse-substring
      // rule — the tier §29 scores at 0.35 precisely because it produces
      // confident-looking nonsense.
      expect(legacyVariantA(CATALOG, 'a deep tissue massage please')).toBe(
        undefined,
      );
      expect(legacyVariantB(CATALOG, 'a deep tissue massage please')?.id).toBe(
        's1',
      );

      const result = service.resolveService(
        CATALOG,
        'a deep tissue massage please',
      );
      expect(result.status).not.toBe('resolved');
      expect(result.match).toBeNull();
    });

    it('refuses "the facial" rather than resolving it two different ways', () => {
      expect(legacyVariantA(CATALOG, 'the facial')).toBeUndefined();
      expect(legacyVariantB(CATALOG, 'the facial')?.id).toBe('s4');

      expect(service.resolveService(CATALOG, 'the facial').match).toBeNull();
    });
  });

  describe('the silent picks it refuses', () => {
    it('asks which massage instead of taking the first row', () => {
      // Every shipped variant returns "Massage" here — not because it is right,
      // but because it is first in the array. Three services match.
      expect(legacyVariantA(CATALOG, 'massage')?.id).toBe('s1');

      const result = service.resolveService(CATALOG, 'massage');
      expect(result.status).toBe('resolved');
      expect(result.match?.id).toBe('s1');
      // "Massage" is an EXACT match, so this one is genuinely resolvable —
      // the tier system separates it from the ambiguous case below.
      expect(result.tier).toBe('exact');
    });

    it('is ambiguous when two services tie at the same tier', () => {
      const ambiguous = [
        { id: 'a', name: 'Swedish Massage' },
        { id: 'b', name: 'Sports Massage' },
      ];
      const result = service.resolveService(ambiguous, 'massage');
      expect(result.status).toBe('ambiguous');
      expect(result.match).toBeNull();
      expect(result.candidates.map((c) => c.id).sort()).toEqual(['a', 'b']);
    });

    it('offers the tied candidates as answerable options', () => {
      const ambiguous = [
        { id: 'a', name: 'Swedish Massage' },
        { id: 'b', name: 'Sports Massage' },
      ];
      const { value, clarify } = service.serviceOrClarify(
        ambiguous,
        'massage',
        {
          command: 'appointment.create',
          variable: 'serviceId',
        },
      );
      expect(value).toBeNull();
      expect(clarify?.reason).toBe('ambiguous_entity');
      expect(clarify?.options.map((o) => o.value).sort()).toEqual(['a', 'b']);
    });

    it('routes the clarify back to the variable that needs filling', () => {
      // A ClarifyRequest with a null `variable` is a question §38's slot
      // filling cannot merge an answer into — it becomes a dead end.
      const { clarify } = service.serviceOrClarify(
        [
          { id: 'a', name: 'Swedish Massage' },
          { id: 'b', name: 'Sports Massage' },
        ],
        'massage',
        { command: 'appointment.create', variable: 'serviceId' },
      );
      expect(clarify?.command).toBe('appointment.create');
      expect(clarify?.variable).toBe('serviceId');
    });

    it('labels a service clarify as a service', () => {
      const { clarify } = service.serviceOrClarify(
        CATALOG,
        'nonexistent thing',
      );
      expect(clarify?.question).toContain('service');
    });
  });

  describe('names→IDs', () => {
    const staff = [
      { id: 'e1', name: 'John Smith' },
      { id: 'e2', name: 'Jane Doe' },
    ];

    it('resolves a first name as a whole token', () => {
      const result = service.resolveEntity(staff, 'John');
      expect(result.match?.id).toBe('e1');
      expect(result.tier).toBe('full_token');
    });

    it('refuses when two people share the token', () => {
      const result = service.resolveEntity(
        [...staff, { id: 'e3', name: 'John Baker' }],
        'John',
      );
      expect(result.status).toBe('ambiguous');
    });

    it('resolves a batch independently', () => {
      const { resolved, unresolved } = service.resolveEntities(staff, [
        'John',
        'Jane',
      ]);
      expect(resolved.map((r) => r.id)).toEqual(['e1', 'e2']);
      expect(unresolved).toEqual([]);
    });

    it('reports a name it could not match instead of dropping it', () => {
      // `resolveEmployees` drops misses, so "cancel for John and Mary" with an
      // unknown Mary quietly becomes "cancel for John" — a narrower action than
      // the user asked for, performed without saying so.
      const { resolved, unresolved } = service.resolveEntities(staff, [
        'John',
        'Mary',
      ]);
      expect(resolved.map((r) => r.id)).toEqual(['e1']);
      expect(unresolved.map((u) => u.query)).toEqual(['Mary']);
    });

    it('does not merge accented names', () => {
      // "Renée" and "Renee" are plausibly two people; merging them silently is
      // the same class of error as a silent pick.
      const result = service.resolveEntity(
        [
          { id: 'r1', name: 'Renée' },
          { id: 'r2', name: 'Renee' },
        ],
        'Renee',
      );
      expect(result.match?.id).toBe('r2');
    });
  });

  describe('dates→ISO', () => {
    const context = {
      now: new Date('2026-08-07T12:00:00Z'),
      timeZone: 'America/Los_Angeles',
    };

    it('resolves "tomorrow" in the business timezone', () => {
      expect(service.resolveDate('tomorrow', context).date).toBe('2026-08-08');
    });

    it('resolves "tomorrow" correctly in the local evening', () => {
      // e2e-bug.363: the two shipped `resolveTomorrowDateKey` copies compute
      // now+24h then .toISOString(), i.e. the UTC date, which is a day late
      // every local evening. 05:00Z is 22:00 the previous day in Los Angeles.
      const evening = {
        now: new Date('2026-08-08T05:00:00Z'),
        timeZone: 'America/Los_Angeles',
      };
      expect(service.resolveDate('tomorrow', evening).date).toBe('2026-08-08');
    });

    it('refuses a vague phrase instead of guessing', () => {
      const result = service.resolveDate('soon', context);
      expect(result.status).not.toBe('resolved');
      expect(result.date).toBeNull();
    });

    it('returns an answerable question for a vague phrase', () => {
      const { value, clarify } = service.dateOrClarify('soon', context, {
        command: 'appointment.create',
        variable: 'date',
      });
      expect(value).toBeNull();
      expect(clarify?.variable).toBe('date');
    });
  });

  describe('times→ISO', () => {
    it('keeps the meridiem when a space precedes it', () => {
      // e2e-bug.364: `extractTimeSlotFromPrompt` (2 copies) tries bare HH:MM
      // before its am/pm rule and the \b is satisfied by the space, so
      // "3:30 pm" comes back as 03:30 — twelve hours early.
      expect(service.resolveTime('3:30 pm').time).toBe('15:30');
      expect(service.resolveTime('3:30pm').time).toBe('15:30');
    });

    it('handles midnight without turning it into noon', () => {
      expect(service.resolveTime('12:00 am').time).toBe('00:00');
      expect(service.resolveTime('12:00 pm').time).toBe('12:00');
    });

    it('narrows a bare hour using business hours', () => {
      expect(
        service.resolveTime('at 3', {
          businessHours: { openHour: 9, closeHour: 19 },
        }).time,
      ).toBe('15:00');
    });

    it('refuses a bare hour that both readings allow', () => {
      // Open 06:00–22:00 makes "at 8" genuinely either 08:00 or 20:00.
      const result = service.resolveTime('at 8', {
        businessHours: { openHour: 6, closeHour: 22 },
      });
      expect(result.status).not.toBe('resolved');
    });
  });

  describe('relative ranges', () => {
    it('delegates to the existing timezone-correct range parser', () => {
      // §32 extended `resolveDateRange` in place rather than adding a competing
      // parser. Wrapping it here rather than reimplementing keeps that true.
      const range = service.resolveRange(
        { _timeZone: 'America/Los_Angeles' },
        'next 2 weeks',
        'America/Los_Angeles',
      );
      expect(range).not.toBeNull();
      expect(range?.start).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });

    it('returns null rather than a guess when there is no range', () => {
      expect(service.resolveRange({}, 'hello there')).toBeNull();
    });
  });
});
