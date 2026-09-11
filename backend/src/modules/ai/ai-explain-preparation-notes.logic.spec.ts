import {
  buildExplainPreparationNotesSummary,
  handleExplainPreparationNotesLogic,
} from './ai-explain-preparation-notes.logic.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { matchCustomerOwnedBooking } from './ai-cancel-my-booking.util.js';

/**
 * e2e-bug.503 — these bookings must stay in the future.
 *
 * `matchCustomerOwnedBooking` filters to `status === CONFIRMED && startTime >=
 * now` before it looks at anything else, so a literal date silently empties the
 * candidate list once it passes. That is what happened here: the two `Lipid
 * Panel` visits below were written as 2026-07-15/16, and after those days went
 * by the ambiguity test stopped seeing two candidates and started seeing none —
 * reported as an assertion mismatch rather than the fixture expiry it was.
 * Same class as e2e-bug.491.
 *
 * Computed once at module load so every booking in one run shares a single
 * `now`, and offset in whole days so the assertions never straddle midnight.
 */
const FROZEN_NOW = new Date();
const AT = (daysAhead: number, hour = 14): Date => {
  const d = new Date(FROZEN_NOW);
  d.setUTCDate(d.getUTCDate() + daysAhead);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};

function makeDeps(
  overrides: Partial<SelfServiceBookingLogicDeps> = {},
): SelfServiceBookingLogicDeps {
  return {
    bookingRepo: {
      findOne: jest.fn(async () => ({
        id: 'book-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: BookingStatus.CONFIRMED,
        startTime: AT(7),
        endTime: AT(7, 15),
        service: {
          id: 'svc-1',
          name: 'Lipid Panel',
          metadata: {
            serviceType: 'lab_test',
            requiresFasting: true,
            preparationNotes: 'Fast 12 hours before draw.',
          },
        },
      })),
      find: jest.fn(),
    } as unknown as SelfServiceBookingLogicDeps['bookingRepo'],
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        name: 'City Clinic',
      })),
    } as unknown as SelfServiceBookingLogicDeps['businessRepo'],
    serviceRepo: {
      find: jest.fn(async () => []),
    } as unknown as SelfServiceBookingLogicDeps['serviceRepo'],
    ...overrides,
  } as SelfServiceBookingLogicDeps;
}

describe('ai-explain-preparation-notes.logic (ai-cmd-customer-4.3.4)', () => {
  it('buildExplainPreparationNotesSummary covers fasting and prep', () => {
    const summary = buildExplainPreparationNotesSummary({
      service: {
        id: 'svc-1',
        name: 'Lipid Panel',
        metadata: {
          serviceType: 'lab_test',
          requiresFasting: true,
          preparationNotes: 'Fast 12 hours before draw.',
        },
      },
      aspect: 'all',
    });
    expect(summary).toContain('fasting is required');
    expect(summary).toContain('Fast 12 hours');
  });

  it('returns preparation notes from booked service', async () => {
    const result = await handleExplainPreparationNotesLogic(
      makeDeps(),
      'biz-1',
      { aspect: 'fasting', bookingId: 'book-1', sessionCustomerId: 'cust-1' },
      'Do I need to fast?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_preparation_notes');
    expect(result.details.requiresFasting).toBe(true);
    expect(result.details.preparationNotes).toBe('Fast 12 hours before draw.');
  });

  it('returns failure when booking cannot be resolved', async () => {
    const deps = makeDeps({
      bookingRepo: {
        findOne: jest.fn(async () => null),
        find: jest.fn(async () => []),
      } as unknown as SelfServiceBookingLogicDeps['bookingRepo'],
    });

    const result = await handleExplainPreparationNotesLogic(
      deps,
      'biz-1',
      {},
      'Do I need to fast?',
    );

    expect(result.success).toBe(false);
    expect(result.details.clarify).toBe(true);
  });

  it('returns tour meeting point details', async () => {
    const deps = makeDeps({
      bookingRepo: {
        findOne: jest.fn(async () => ({
          id: 'book-2',
          businessId: 'biz-1',
          customerId: 'cust-1',
          status: BookingStatus.CONFIRMED,
          service: {
            id: 'svc-2',
            name: 'City Tour',
            metadata: {
              serviceType: 'tour',
              meetingPoint: 'Main hotel lobby',
              includedItems: 'Comfortable shoes',
            },
          },
        })),
      } as unknown as SelfServiceBookingLogicDeps['bookingRepo'],
    });

    const result = await handleExplainPreparationNotesLogic(
      deps,
      'biz-1',
      {
        aspect: 'meeting_point',
        bookingId: 'book-2',
        sessionCustomerId: 'cust-1',
      },
      'What should I bring to my City Tour appointment?',
    );

    expect(result.success).toBe(true);
    expect(result.details.includedItems).toBe('Comfortable shoes');
  });

  it('does not handle tour meeting point prompts', async () => {
    const deps = makeDeps();
    const result = await handleExplainPreparationNotesLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Where do we meet for my tour?',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns ambiguous booking failure when service matches multiple visits', async () => {
    const deps = makeDeps({
      bookingRepo: {
        findOne: jest.fn(),
        find: jest.fn(async () => [
          {
            id: 'book-a',
            businessId: 'biz-1',
            customerId: 'cust-1',
            status: BookingStatus.CONFIRMED,
            startTime: AT(7),
            service: {
              id: 'svc-a',
              name: 'Lipid Panel',
              metadata: { serviceType: 'lab_test', requiresFasting: true },
            },
          },
          {
            id: 'book-b',
            businessId: 'biz-1',
            customerId: 'cust-1',
            status: BookingStatus.CONFIRMED,
            startTime: AT(8),
            service: {
              id: 'svc-b',
              name: 'Lipid Panel',
              metadata: { serviceType: 'lab_test', requiresFasting: true },
            },
          },
        ]),
      } as unknown as SelfServiceBookingLogicDeps['bookingRepo'],
    });

    const result = await handleExplainPreparationNotesLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1', serviceName: 'Lipid Panel' },
      'Do I need to fast for my lipid panel?',
    );

    expect(result.success).toBe(false);
    expect(result.details.candidates).toHaveLength(2);
  });

  it('resolves service by name when no booking is linked', async () => {
    const deps = makeDeps({
      bookingRepo: {
        findOne: jest.fn(async () => null),
        find: jest.fn(async () => []),
      } as unknown as SelfServiceBookingLogicDeps['bookingRepo'],
      serviceRepo: {
        find: jest.fn(async () => [
          {
            id: 'svc-3',
            name: 'City Tour',
            metadata: {
              serviceType: 'tour',
              meetingPoint: 'Lobby',
              includedItems: 'Shoes',
            },
          },
        ]),
      } as unknown as SelfServiceBookingLogicDeps['serviceRepo'],
    });

    const result = await handleExplainPreparationNotesLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1', serviceName: 'City Tour', aspect: 'all' },
      'What should I bring for the city tour?',
    );

    expect(result.success).toBe(true);
    expect(result.details.serviceName).toBe('City Tour');
  });

  it('returns clarify when prompt cannot be parsed', async () => {
    const result = await handleExplainPreparationNotesLogic(
      makeDeps(),
      'biz-1',
      {},
      'hello',
    );

    expect(result.success).toBe(false);
    expect(result.details.missing).toContain('aspect');
  });

  it('returns failure when business is missing', async () => {
    const deps = makeDeps({
      businessRepo: {
        findOne: jest.fn(async () => null),
      } as unknown as SelfServiceBookingLogicDeps['businessRepo'],
    });

    const result = await handleExplainPreparationNotesLogic(
      deps,
      'missing',
      { bookingId: 'book-1' },
      'Do I need to fast?',
    );

    expect(result.success).toBe(false);
    expect(result.action).toBe('explain_preparation_notes');
  });
});

/**
 * e2e-bug.453 — the swappable-argument class, one live instance.
 *
 * `matchCustomerOwnedBooking(bookings, params, prompt, timeZone, options)` was
 * handed a *service name* in its `prompt` slot here. Both are `string`, so it
 * compiled, and 91 tests in this file passed over it.
 *
 * Two things kept it invisible. The matcher filters by service from
 * `params.serviceName`, never from this argument, so the wrong value changed
 * nothing about service matching; and with `allowFirstWhenUnspecified` it
 * returns the earliest upcoming booking when it has nothing to narrow by, so
 * the loss produced a *plausible* answer every time. What it actually cost is
 * the argument's real job — date narrowing, via `resolveDateRange` and
 * `extractSingleIsoDayFromPrompt`.
 *
 * The capability and the wiring are asserted separately below, because a
 * handler-level behavioural test does not isolate this: `resolveBookingFor
 * PreparationNotes` first runs the prompt through
 * `enrichRescheduleMyBookingParamsFromPrompt`, which rewrites the date params
 * that `matchCustomerOwnedBooking` then reads, so an end-to-end assertion here
 * measures that enrichment rather than this argument.
 */
describe('e2e-bug.453 — the prompt reaches the booking matcher', () => {
  const WEEKDAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const upcoming = () =>
    [
      {
        id: 'book-early',
        status: BookingStatus.CONFIRMED,
        startTime: AT(1),
        service: { id: 'svc-a', name: 'Lipid Panel' },
      },
      {
        id: 'book-late',
        status: BookingStatus.CONFIRMED,
        startTime: AT(3),
        service: { id: 'svc-b', name: 'Lipid Panel' },
      },
    ] as never[];

  it('narrows to the day the prompt names, rather than the next visit', () => {
    // AT(1) and AT(3) always fall on different weekdays, so this names one.
    const namedDay = WEEKDAYS[AT(3).getUTCDay()];

    expect(
      matchCustomerOwnedBooking(
        upcoming(),
        {},
        `Do I need to fast for my visit on ${namedDay}?`,
        'UTC',
        { allowFirstWhenUnspecified: true },
      ).booking?.id,
    ).toBe('book-late');
  });

  it('falls back to the earliest visit when the prompt names no day', () => {
    // Why the defect was silent: the wrong argument still produced a plausible
    // answer, because this is what an empty prompt does.
    expect(
      matchCustomerOwnedBooking(upcoming(), {}, '', 'UTC', {
        allowFirstWhenUnspecified: true,
      }).booking?.id,
    ).toBe('book-early');
  });

  it('the handler passes the prompt, not the service name', () => {
    // The regression guard for the fix itself. Both arguments are `string`, so
    // nothing else can catch a swap back — same reasoning as the source-level
    // assertions in `ai-command.strict-customer-resolver.spec.ts`.
    const src = readFileSync(
      join(__dirname, 'ai-explain-preparation-notes.logic.ts'),
      'utf8',
    );
    const call = src.slice(
      src.indexOf('matchCustomerOwnedBooking('),
      src.indexOf('matchCustomerOwnedBooking(') + 260,
    );
    expect(call).toContain('matchCustomerOwnedBooking(');
    expect(call).not.toContain('parsed.serviceName');
    expect(call).toMatch(/matchParams,\s*\n\s*prompt,/);
  });
});
