import { PROVIDER_EXP_2_PROMPT_SCENARIOS } from './ai-provider-exp-2.fixtures.js';
import {
  buildDraftReviewResponseText,
  buildExplainRequestReviewFlowText,
  extractBookingActionCustomerName,
  extractRunningLateMinutesFromPrompt,
  formatExplainReviewsInboxSummary,
  formatListTeamUnpaidTodaySummary,
  formatProviderMyStatsSummary,
  formatTeamFloorStatusSummary,
  inferMyStatsPeriodFromPrompt,
  inferMyStatsScopeFromPrompt,
  inferReviewsInboxPeriodFromPrompt,
  inferReviewsInboxRatingFilterFromPrompt,
  isCheckInClientPrompt,
  isDraftReviewResponsePrompt,
  isExplainRequestReviewFlowPrompt,
  isExplainReviewsInboxPrompt,
  isListReassignOptionsPrompt,
  isListTeamUnpaidTodayPrompt,
  isMarkReadyNowPrompt,
  isMarkRunningLatePrompt,
  isMyStatsPrompt,
  isReassignBookingSameDayPrompt,
  isRequestClientReviewPrompt,
  isSuggestCancelNotePrompt,
  isTeamFloorStatusPrompt,
  rescueProviderExp2Intent,
} from './ai-provider-exp-2.util.js';

describe('ai-provider-exp-2.util', () => {
  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'my_stats',
    ).map((s) => [s.id, s.prompt]),
  )('detects my_stats prompt %s', (_id, prompt) => {
    expect(isMyStatsPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'team_floor_status',
    ).map((s) => [s.id, s.prompt]),
  )('detects team_floor_status prompt %s', (_id, prompt) => {
    expect(isTeamFloorStatusPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'list_team_unpaid_today',
    ).map((s) => [s.id, s.prompt]),
  )('detects list_team_unpaid_today prompt %s', (_id, prompt) => {
    expect(isListTeamUnpaidTodayPrompt(prompt)).toBe(true);
    expect(rescueProviderExp2Intent(prompt, 'unknown')).toEqual({
      action: 'list_team_unpaid_today',
      rescueReason: 'list_team_unpaid_today',
    });
  });

  it('does not let list_team_unpaid_today steal payment_sweep mutations', () => {
    expect(isListTeamUnpaidTodayPrompt('Mark all unpaid appointments today as paid')).toBe(
      false,
    );
    expect(isListTeamUnpaidTodayPrompt('Payment sweep for today')).toBe(false);
    expect(isListTeamUnpaidTodayPrompt('Collect outstanding balances today')).toBe(
      false,
    );
  });

  it('formats the team unpaid today summary', () => {
    expect(
      formatListTeamUnpaidTodaySummary(
        { date: '2026-07-10', totalUnpaid: 0, bookings: [] },
        {},
      ),
    ).toBe('Everyone on the floor is paid up today.');

    const summary = formatListTeamUnpaidTodaySummary(
      {
        date: '2026-07-10',
        totalUnpaid: 1,
        bookings: [
          {
            id: 'bk-1',
            customerName: 'Jane Doe',
            employeeName: 'Sam',
            serviceName: 'Haircut',
            startTime: new Date('2026-07-10T14:00:00.000Z'),
            servicePrice: 45,
          },
        ],
      },
      {},
    );
    expect(summary).toContain('1 unpaid appointment today:');
    expect(summary).toContain('Jane Doe with Sam');
    expect(summary).toContain('Haircut');
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'explain_reviews_inbox',
    ).map((s) => [s.id, s.prompt]),
  )('detects explain_reviews_inbox prompt %s', (_id, prompt) => {
    expect(isExplainReviewsInboxPrompt(prompt)).toBe(true);
    expect(rescueProviderExp2Intent(prompt, 'unknown')).toEqual({
      action: 'explain_reviews_inbox',
      rescueReason: 'explain_reviews_inbox',
    });
  });

  it('does not let explain_reviews_inbox steal request_client_review mutations', () => {
    expect(isExplainReviewsInboxPrompt('Ask Jane for a review')).toBe(false);
    expect(
      isExplainReviewsInboxPrompt('Send a review request for this booking'),
    ).toBe(false);
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'explain_request_review_flow',
    ).map((s) => [s.id, s.prompt]),
  )('detects explain_request_review_flow prompt %s', (_id, prompt) => {
    expect(isExplainRequestReviewFlowPrompt(prompt)).toBe(true);
    expect(rescueProviderExp2Intent(prompt, 'unknown')).toEqual({
      action: 'explain_request_review_flow',
      rescueReason: 'explain_request_review_flow',
    });
  });

  it('does not let explain_request_review_flow steal request_client_review mutations', () => {
    expect(isExplainRequestReviewFlowPrompt('Ask Jane for a review')).toBe(
      false,
    );
    expect(
      isExplainRequestReviewFlowPrompt('Send a review request for this booking'),
    ).toBe(false);
  });

  it('builds the explain_request_review_flow policy text', () => {
    const text = buildExplainRequestReviewFlowText();
    expect(text).toContain('Request review');
    expect(text).toContain('once per visit');
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'draft_review_response',
    ).map((s) => [s.id, s.prompt]),
  )('detects draft_review_response prompt %s', (_id, prompt) => {
    expect(isDraftReviewResponsePrompt(prompt)).toBe(true);
    expect(rescueProviderExp2Intent(prompt, 'unknown')).toEqual({
      action: 'draft_review_response',
      rescueReason: 'draft_review_response',
    });
  });

  it('does not let draft_review_response steal request_client_review mutations', () => {
    expect(isDraftReviewResponsePrompt('Ask Jane for a review')).toBe(false);
    expect(
      isDraftReviewResponsePrompt('Send a review request for this booking'),
    ).toBe(false);
  });

  it('drafts a review response tailored to the rating', () => {
    expect(
      buildDraftReviewResponseText({
        rating: 5,
        comment: 'Loved it',
        customerName: 'Jane',
      }),
    ).toContain('thank you');
    expect(
      buildDraftReviewResponseText({
        rating: 3,
        comment: null,
        customerName: 'Jane',
      }),
    ).toContain('improve');
    expect(
      buildDraftReviewResponseText({
        rating: 1,
        comment: 'Bad',
        customerName: 'Jane',
      }),
    ).toContain('sorry');
  });

  it('infers a rating filter from the reviews inbox prompt', () => {
    expect(
      inferReviewsInboxRatingFilterFromPrompt('Latest 5-star reviews', {}),
    ).toEqual({ minRating: 5, maxRating: 5, ratingLabel: '5★ ' });
    expect(
      inferReviewsInboxRatingFilterFromPrompt('Any bad reviews this week?', {}),
    ).toEqual({ maxRating: 3, ratingLabel: 'low-rated ' });
    expect(
      inferReviewsInboxRatingFilterFromPrompt('My rating this month', {}),
    ).toBeUndefined();
    expect(
      inferReviewsInboxRatingFilterFromPrompt('anything', { rating: 4 }),
    ).toEqual({ minRating: 4, maxRating: 4, ratingLabel: '4★ ' });
  });

  it('infers the reviews inbox period from the prompt', () => {
    expect(inferReviewsInboxPeriodFromPrompt('Bad review yesterday', {})).toBe(
      'yesterday',
    );
    expect(inferReviewsInboxPeriodFromPrompt('Any reviews today?', {})).toBe(
      'today',
    );
    expect(
      inferReviewsInboxPeriodFromPrompt('Reviews this week', {}),
    ).toBe('week');
    expect(inferReviewsInboxPeriodFromPrompt('My rating this month', {})).toBe(
      'month',
    );
    expect(inferReviewsInboxPeriodFromPrompt('My rating', {})).toBe('month');
    expect(
      inferReviewsInboxPeriodFromPrompt('anything', { period: 'today' }),
    ).toBe('today');
  });

  it('formats the reviews inbox summary', () => {
    expect(
      formatExplainReviewsInboxSummary({
        scope: 'mine',
        period: 'month',
        averageRating: null,
        reviewCount: 0,
        reviews: [],
      }),
    ).toBe('Your reviews this month: no reviews yet.');

    const summary = formatExplainReviewsInboxSummary({
      scope: 'team',
      period: 'yesterday',
      averageRating: 3.5,
      reviewCount: 2,
      reviews: [
        {
          id: 'rev-1',
          rating: 2,
          comment: 'Could be better',
          customerName: 'Jane Doe',
          employeeName: 'Sam',
          createdAt: new Date('2026-07-09T14:00:00.000Z'),
        },
        {
          id: 'rev-2',
          rating: 5,
          comment: null,
          customerName: null,
          employeeName: 'Alex',
          createdAt: new Date('2026-07-09T15:00:00.000Z'),
        },
      ],
    });
    expect(summary).toContain('Team reviews yesterday: 2 reviews, 3.5★ average.');
    expect(summary).toContain('2★ — Jane Doe (Sam): "Could be better" (low)');
    expect(summary).toContain('5★ (Alex)');
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'check_in_client',
    ).map((s) => [s.id, s.prompt]),
  )('detects check_in_client prompt %s', (_id, prompt) => {
    expect(isCheckInClientPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'mark_running_late',
    ).map((s) => [s.id, s.prompt]),
  )('detects mark_running_late prompt %s', (_id, prompt) => {
    expect(isMarkRunningLatePrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'mark_ready_now',
    ).map((s) => [s.id, s.prompt]),
  )('detects mark_ready_now prompt %s', (_id, prompt) => {
    expect(isMarkReadyNowPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'suggest_cancel_note',
    ).map((s) => [s.id, s.prompt]),
  )('detects suggest_cancel_note prompt %s', (_id, prompt) => {
    expect(isSuggestCancelNotePrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'request_client_review',
    ).map((s) => [s.id, s.prompt]),
  )('detects request_client_review prompt %s', (_id, prompt) => {
    expect(isRequestClientReviewPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'list_reassign_options',
    ).map((s) => [s.id, s.prompt]),
  )('detects list_reassign_options prompt %s', (_id, prompt) => {
    expect(isListReassignOptionsPrompt(prompt)).toBe(true);
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.filter(
      (s) => s.expectedAction === 'reassign_booking_same_day',
    ).map((s) => [s.id, s.prompt]),
  )('detects reassign_booking_same_day prompt %s', (_id, prompt) => {
    expect(isReassignBookingSameDayPrompt(prompt)).toBe(true);
  });

  it.each(PROVIDER_EXP_2_PROMPT_SCENARIOS.map((s) => [s.id, s]))(
    'rescues $0 to $1.expectedAction',
    (_id, scenario) => {
      expect(rescueProviderExp2Intent(scenario.prompt, 'unknown')?.action).toBe(
        scenario.expectedAction,
      );
    },
  );

  it('infers month period and team scope from prompt', () => {
    expect(inferMyStatsPeriodFromPrompt('How am I doing this month?', {})).toBe(
      'month',
    );
    expect(inferMyStatsScopeFromPrompt('Team stats for the week', {})).toBe(
      'team',
    );
    expect(inferMyStatsPeriodFromPrompt('stats', { period: 'month' })).toBe(
      'month',
    );
    expect(inferMyStatsScopeFromPrompt('stats', { scope: 'team' })).toBe(
      'team',
    );
  });

  it('extracts running late minutes from prompt and params', () => {
    expect(
      extractRunningLateMinutesFromPrompt("I'm running 10 minutes late", {}),
    ).toBe(10);
    expect(
      extractRunningLateMinutesFromPrompt('late', { minutesLate: 15 }),
    ).toBe(15);
  });

  it('formats my stats summary with tips and reviews', () => {
    const summary = formatProviderMyStatsSummary(
      {
        period: 'week',
        scope: 'mine',
        from: '2026-06-02',
        to: '2026-06-08',
        canTeamRollup: false,
        completedBookings: 12,
        paidRevenue: 480,
        currency: 'USD',
        utilizationPercent: 72,
        bookedMinutes: 360,
        scheduledMinutes: 500,
        averageReviewScore: 4.8,
        newReviewsCount: 3,
        employeeCount: 1,
        tipsEnabled: true,
        tipTotal: 40,
        tippedVisitCount: 4,
      },
      { currency: 'USD' },
    );
    expect(summary).toContain('12 completed visits');
    expect(summary).toContain('4.8★');
    expect(summary).toContain('tips');
  });

  it('formats empty team floor summary', () => {
    expect(
      formatTeamFloorStatusSummary({
        date: '2026-06-09',
        viewMode: 'team',
        filterEmployeeId: null,
        providers: [],
        columns: [],
        totalBookings: 0,
      }),
    ).toContain('clear today');
  });

  it('formats team floor summary with column counts', () => {
    const summary = formatTeamFloorStatusSummary({
      date: '2026-06-09',
      viewMode: 'team',
      filterEmployeeId: null,
      providers: [{ id: 'emp-1', name: 'Alex' }],
      totalBookings: 2,
      columns: [
        {
          employeeId: 'emp-1',
          employeeName: 'Alex',
          statusCounts: {
            waiting: 1,
            in_service: 1,
            done: 0,
            no_show: 0,
          },
          bookings: [
            {
              id: 'bk-1',
              teamFloorStatus: 'waiting',
              customer: { name: 'Jane' },
            },
          ],
        },
      ],
    } as any);
    expect(summary).toContain('Team floor today');
    expect(summary).toContain('Alex');
    expect(summary).toContain('Jane');
  });

  it('extracts customer names from check-in and running late prompts', () => {
    expect(extractBookingActionCustomerName('Check in Jane Doe', {})).toBe(
      'Jane Doe',
    );
    expect(extractBookingActionCustomerName('Mark Sam checked in', {})).toBe(
      'Sam',
    );
    expect(
      extractBookingActionCustomerName(
        "I'm running 10 minutes late for Jane",
        {},
      ),
    ).toBe('Jane');
  });

  it('rescues summarize_utilization misroute to my_stats', () => {
    expect(
      rescueProviderExp2Intent(
        'Show my stats this week',
        'summarize_utilization',
      )?.action,
    ).toBe('my_stats');
  });

  it('extracts armenian and cyrillic running late minutes', () => {
    expect(extractRunningLateMinutesFromPrompt('Ես 10 րոպե ուշ եմ', {})).toBe(
      10,
    );
    expect(
      extractRunningLateMinutesFromPrompt('Я опаздываю на 10 минут', {}),
    ).toBe(10);
  });

  it('reads numeric minutesLate param when already a number', () => {
    expect(
      extractRunningLateMinutesFromPrompt('late', { minutesLate: 12 }),
    ).toBe(12);
    expect(
      extractRunningLateMinutesFromPrompt('late', { minutesLate: '8' }),
    ).toBe(8);
  });

  it('returns null when prompt does not match exp-2 intents', () => {
    expect(rescueProviderExp2Intent('hello team', 'unknown')).toBeNull();
  });

  it('formats idle team floor column without active bookings', () => {
    const summary = formatTeamFloorStatusSummary({
      date: '2026-06-09',
      viewMode: 'team',
      filterEmployeeId: null,
      providers: [{ id: 'emp-2', name: 'Sam' }],
      totalBookings: 1,
      columns: [
        {
          employeeId: 'emp-2',
          employeeName: 'Sam',
          statusCounts: {
            waiting: 0,
            in_service: 0,
            done: 0,
            no_show: 0,
          },
          bookings: [],
        },
      ],
    } as any);
    expect(summary).toContain('idle');
  });

  it('formats team-scoped stats label', () => {
    const summary = formatProviderMyStatsSummary(
      {
        period: 'week',
        scope: 'team',
        from: '2026-06-02',
        to: '2026-06-08',
        canTeamRollup: true,
        completedBookings: 20,
        paidRevenue: 2000,
        currency: 'USD',
        utilizationPercent: 80,
        bookedMinutes: 400,
        scheduledMinutes: 500,
        averageReviewScore: 5,
        newReviewsCount: 1,
        employeeCount: 4,
        tipsEnabled: true,
        tipTotal: 100,
        tippedVisitCount: 5,
      },
      { currency: 'USD' },
    );
    expect(summary).toContain('Team stats');
    expect(summary).toContain('tips');
  });

  it('formats my stats without optional review and tip lines', () => {
    const summary = formatProviderMyStatsSummary(
      {
        period: 'week',
        scope: 'mine',
        from: '2026-06-02',
        to: '2026-06-08',
        canTeamRollup: false,
        completedBookings: 0,
        paidRevenue: 0,
        currency: 'USD',
        utilizationPercent: 0,
        bookedMinutes: 0,
        scheduledMinutes: 0,
        averageReviewScore: null,
        newReviewsCount: 0,
        employeeCount: 1,
        tipsEnabled: false,
      },
      { currency: 'USD' },
    );
    expect(summary).toContain('0 completed visits');
    expect(summary).not.toContain('★');
  });
});
