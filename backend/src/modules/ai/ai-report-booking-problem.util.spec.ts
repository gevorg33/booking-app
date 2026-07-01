import {
  REPORT_BOOKING_PROBLEM_BOUNDARY_PROMPTS,
  REPORT_BOOKING_PROBLEM_PROMPTS,
  REPORT_BOOKING_PROBLEM_RESCUE_SCENARIOS,
} from './ai-report-booking-problem.fixtures.js';
import { REPORT_BOOKING_PROBLEM_MULTILINGUAL_SCENARIOS } from './ai-report-booking-problem-multilingual.fixtures.js';
import {
  buildDefaultBookingProblemMessage,
  buildPublicBookingSupportUrl,
  buildReportBookingProblemAmbiguousSummary,
  buildReportBookingProblemNavigate,
  enrichReportBookingProblemParamsFromPrompt,
  isReportBookingProblemIntent,
  isReportBookingProblemPrompt,
  matchCustomerOwnedProblemBooking,
  parseReportBookingProblemFromPrompt,
  rescueReportBookingProblemIntent,
  resolveReportBookingProblemAspect,
} from './ai-report-booking-problem.util.js';

describe('ai-report-booking-problem.util (ai-cmd-customer-4.12.3)', () => {
  it.each(REPORT_BOOKING_PROBLEM_PROMPTS.map((row) => [row.id, row.prompt]))(
    'detects prompt %s',
    (_id, prompt) => {
      expect(isReportBookingProblemPrompt(prompt)).toBe(true);
    },
  );

  it.each(
    REPORT_BOOKING_PROBLEM_MULTILINGUAL_SCENARIOS.map((row) => [
      row.id,
      row.prompt,
    ]),
  )('detects multilingual prompt %s', (_id, prompt) => {
    expect(isReportBookingProblemPrompt(prompt)).toBe(true);
  });

  it.each(REPORT_BOOKING_PROBLEM_BOUNDARY_PROMPTS)(
    'rejects boundary prompt $id',
    ({ prompt }) => {
      expect(isReportBookingProblemPrompt(prompt)).toBe(false);
    },
  );

  it.each(REPORT_BOOKING_PROBLEM_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueReportBookingProblemIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('parses aspect and matches bookings', () => {
    expect(resolveReportBookingProblemAspect('I was charged twice')).toBe(
      'billing_issue',
    );
    const parsed = parseReportBookingProblemFromPrompt(
      'Something went wrong with my visit',
      {},
    );
    expect(parsed?.aspect).toBe('visit_issue');
    const matched = matchCustomerOwnedProblemBooking(
      [
        {
          id: 'b1',
          serviceName: 'Haircut',
          startTime: '2030-01-01T10:00:00.000Z',
          endTime: '2030-01-01T11:00:00.000Z',
          status: 'completed',
          paymentStatus: 'paid',
        },
      ],
      {},
      'Something went wrong with my visit',
      'visit_issue',
      'UTC',
    );
    expect(matched.booking?.id).toBe('b1');
    expect(
      buildDefaultBookingProblemMessage('Haircut', 'billing_issue'),
    ).toMatch(/billing issue/i);
  });

  it('recognizes report_booking_problem intent', () => {
    expect(isReportBookingProblemIntent('report_booking_problem')).toBe(true);
    expect(
      rescueReportBookingProblemIntent(
        'I was charged twice',
        'report_booking_problem',
      ),
    ).toBeNull();
  });

  it('detects Armenian and Cyrillic problem prompts', () => {
    expect(
      isReportBookingProblemPrompt('Իմ այցի հետ սխալ էր, զեկուցել եմ'),
    ).toBe(true);
    expect(
      isReportBookingProblemPrompt(
        'С моим визитом пошло не так, списали дважды',
      ),
    ).toBe(true);
  });

  it('enriches params and parses quoted message', () => {
    const enriched = enrichReportBookingProblemParamsFromPrompt(
      {},
      'Report a problem for my haircut — say "stylist was rude"',
    );
    expect(enriched.aspect).toBeDefined();
    const parsed = parseReportBookingProblemFromPrompt(
      'Report a problem for my haircut — say "stylist was rude"',
      {},
    );
    expect(parsed?.message).toBe('stylist was rude');
    expect(
      parseReportBookingProblemFromPrompt('Contact support', {}),
    ).toBeNull();
  });

  it('picks most recent booking when multiple match without specific filters', () => {
    const matched = matchCustomerOwnedProblemBooking(
      [
        {
          id: 'b1',
          serviceName: 'Haircut',
          startTime: '2030-01-01T10:00:00.000Z',
          endTime: '2030-01-01T11:00:00.000Z',
          status: 'completed',
          paymentStatus: 'paid',
        },
        {
          id: 'b2',
          serviceName: 'Color',
          startTime: '2030-02-01T10:00:00.000Z',
          endTime: '2030-02-01T11:00:00.000Z',
          status: 'completed',
          paymentStatus: 'paid',
        },
      ],
      {},
      'Something went wrong with my appointment',
      'visit_issue',
      'UTC',
    );
    expect(matched.booking?.id).toBe('b2');
    expect(matched.ambiguous).toHaveLength(0);
  });

  it('matches by booking id prefix and date filters', () => {
    const rows = [
      {
        id: 'book-abc-1',
        serviceName: 'Massage',
        startTime: '2030-03-15T10:00:00.000Z',
        endTime: '2030-03-15T11:00:00.000Z',
        status: 'completed',
        paymentStatus: 'paid',
      },
      {
        id: 'book-xyz-2',
        serviceName: 'Massage',
        startTime: '2030-03-16T10:00:00.000Z',
        endTime: '2030-03-16T11:00:00.000Z',
        status: 'completed',
        paymentStatus: 'paid',
      },
    ];
    expect(
      matchCustomerOwnedProblemBooking(
        rows,
        { bookingId: 'book-abc' },
        '',
        'general',
        'UTC',
      ).booking?.id,
    ).toBe('book-abc-1');
    expect(
      matchCustomerOwnedProblemBooking(
        rows,
        { dateFrom: '2030-03-15', dateTo: '2030-03-15' },
        '',
        'general',
        'UTC',
      ).booking?.id,
    ).toBe('book-abc-1');
    expect(
      matchCustomerOwnedProblemBooking(
        rows,
        {},
        'problem on 2030-03-16',
        'general',
        'UTC',
      ).booking?.id,
    ).toBe('book-xyz-2');
  });

  it('returns ambiguous matches when filters are too broad', () => {
    const rows = [
      {
        id: 'b1',
        serviceName: 'Haircut',
        startTime: '2030-01-01T10:00:00.000Z',
        endTime: '2030-01-01T11:00:00.000Z',
        status: 'completed',
        paymentStatus: 'paid',
      },
      {
        id: 'b2',
        serviceName: 'Hair color',
        startTime: '2030-02-01T10:00:00.000Z',
        endTime: '2030-02-01T11:00:00.000Z',
        status: 'completed',
        paymentStatus: 'paid',
      },
    ];
    const ambiguous = matchCustomerOwnedProblemBooking(
      rows,
      { serviceName: 'Hair' },
      'problem with my hair services',
      'visit_issue',
      'UTC',
    );
    expect(ambiguous.booking).toBeNull();
    expect(ambiguous.ambiguous).toHaveLength(2);
    expect(
      buildReportBookingProblemAmbiguousSummary(ambiguous.ambiguous),
    ).toMatch(/Multiple bookings match/);
  });

  it('builds support url and navigate targets', () => {
    expect(
      buildPublicBookingSupportUrl('salon', 'b1', 'https://book.example.com/'),
    ).toBe('https://book.example.com/book/salon?support=1&bookingId=b1');
    expect(buildPublicBookingSupportUrl('salon', 'b1')).toBeNull();
    expect(buildReportBookingProblemNavigate('b1')).toEqual({
      path: 'account',
      query: { section: 'bookings', supportBookingId: 'b1' },
    });
    expect(
      buildDefaultBookingProblemMessage(
        'Haircut',
        'visit_issue',
        '  custom note ',
      ),
    ).toBe('custom note');
    expect(resolveReportBookingProblemAspect('random support issue')).toBe(
      'general',
    );
  });
});
