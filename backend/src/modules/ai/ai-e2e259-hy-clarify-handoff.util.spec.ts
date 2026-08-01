import { resolveLocale, t } from '../../common/i18n/messages.js';
import {
  E2E259_ENGLISH_FORBIDDEN,
  E2E259_LIVE_CASES,
  E2E259_UNIT_CASES,
} from './ai-e2e259-hy-clarify-handoff.fixtures.js';
import { buildGuideSupportHandoff } from './guide/guide-support-handoff.util.js';
import { handleExplainAnyProviderOptionLogic } from './ai-explain-any-provider-option.logic.js';
import { handleConfirmMyBookingDetailsLogic } from './ai-confirm-my-booking-details.logic.js';

describe('e2e-bug.259 hy clarify/status + Still stuck? handoff', () => {
  it('documents every live case id', () => {
    expect(E2E259_LIVE_CASES.map((c) => c.id)).toEqual([
      'e2e259-live-hy-any-stylist-meaning',
      'e2e259-live-hy-packages-guide-handoff',
      'e2e259-live-ru-packages-guide-handoff',
      'e2e259-live-en-packages-guide-handoff-regression',
      'e2e259-live-hy-booking-help-no-en-chrome',
      'e2e274-live-hy-confirm-time',
      'e2e274-live-hy-confirm-summarize',
      'e2e274-live-en-confirm-summarize-regression',
    ]);
    expect(E2E259_UNIT_CASES.map((c) => c.id).length).toBeGreaterThanOrEqual(9);
  });

  it('e2e259-hy-support-handoff-label', () => {
    const handoff = buildGuideSupportHandoff({
      surface: 'public',
      locale: 'hy',
      topicId: 'public-booking-funnel',
    });
    expect(handoff.label).toBe(t('hy', 'assistant.guideStillStuck'));
    expect(handoff.label).not.toMatch(/Still stuck/i);
    expect(handoff.ticket.subject).not.toMatch(/^Product guide help/i);
    expect(handoff.ticket.body).not.toMatch(
      /The user finished the in-app guide/i,
    );
  });

  it('e2e259-ru-support-handoff-label', () => {
    const handoff = buildGuideSupportHandoff({
      surface: 'public',
      locale: 'ru',
      topicId: 'public-booking-funnel',
    });
    expect(handoff.label).toBe(t('ru', 'assistant.guideStillStuck'));
    expect(handoff.label).not.toMatch(/Still stuck/i);
  });

  it('e2e259-en-support-handoff-label-regression', () => {
    const handoff = buildGuideSupportHandoff({
      surface: 'public',
      locale: 'en',
      topicId: 'public-booking-funnel',
    });
    expect(handoff.label).toBe('Still stuck?');
  });

  it('e2e259-hy-any-provider-clarify', async () => {
    const result = await handleExplainAnyProviderOptionLogic(
      { employeeRepo: { count: async () => 2 } },
      'biz-1',
      { locale: 'hy' },
      'Who is best for curly hair?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.summary).toBe(t('hy', 'assistant.anyProviderClarify'));
    for (const re of E2E259_ENGLISH_FORBIDDEN) {
      expect(result.summary).not.toMatch(re);
    }
  });

  it('e2e259-ru-any-provider-clarify', async () => {
    const result = await handleExplainAnyProviderOptionLogic(
      { employeeRepo: { count: async () => 2 } },
      'biz-1',
      { locale: 'ru' },
      'Who is best for curly hair?',
    );
    expect(result.summary).toBe(t('ru', 'assistant.anyProviderClarify'));
    expect(result.summary).not.toMatch(/Ask what Any stylist/i);
  });

  it('e2e259-en-any-provider-clarify-regression', async () => {
    const result = await handleExplainAnyProviderOptionLogic(
      { employeeRepo: { count: async () => 2 } },
      'biz-1',
      { locale: 'en' },
      'Who is best for curly hair?',
    );
    expect(result.summary).toContain('Ask what Any stylist means');
  });

  it('e2e259-hy-any-provider-success-summary localized', async () => {
    const result = await handleExplainAnyProviderOptionLogic(
      { employeeRepo: { count: async () => 3 } },
      'biz-1',
      { locale: 'hy' },
      'What does Any stylist mean?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toBe(
      t('hy', 'assistant.anyProviderMeaning') +
        t('hy', 'assistant.anyProviderTeamNote', { count: '3' }),
    );
    expect(result.summary).not.toMatch(/do not pick a named stylist/i);
  });
});

describe('e2e-bug.274 confirm clarify locale (sibling of 259)', () => {
  const emptyDeps = {
    bookingRepo: {
      find: async () => [],
      findOne: async () => null,
    },
    businessRepo: {
      findOne: async () => ({ id: 'biz-1', name: 'Salon', address: null }),
    },
  } as unknown as Parameters<typeof handleConfirmMyBookingDetailsLogic>[0];

  it('e2e274-hy-confirm-anon-clarify', async () => {
    const result = await handleConfirmMyBookingDetailsLogic(
      emptyDeps,
      'biz-1',
      { locale: 'hy' },
      'Ինչ ժամի է իմ ամրագրումը?',
    );
    expect(result.action).toBe('confirm_my_booking_details');
    expect(result.success).toBe(false);
    expect(result.summary).toBe(t('hy', 'assistant.confirmBookingAnonClarify'));
    expect(result.summary).not.toMatch(
      /Finish booking or sign in so I can read/i,
    );
  });

  it('e2e274-ru-confirm-anon-clarify', async () => {
    const result = await handleConfirmMyBookingDetailsLogic(
      emptyDeps,
      'biz-1',
      { locale: 'ru' },
      'Когда моя запись?',
    );
    expect(result.summary).toBe(t('ru', 'assistant.confirmBookingAnonClarify'));
  });

  it('e2e274-en-confirm-anon-clarify-regression', async () => {
    const result = await handleConfirmMyBookingDetailsLogic(
      emptyDeps,
      'biz-1',
      { locale: 'en' },
      'What time is my appointment?',
    );
    expect(result.summary).toContain(
      'Finish booking or sign in so I can read your appointment details',
    );
  });

  it('resolveLocale covers fixture locales', () => {
    for (const row of E2E259_UNIT_CASES) {
      expect(resolveLocale(row.locale)).toBe(row.locale);
    }
  });
});
