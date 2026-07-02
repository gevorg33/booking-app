import {
  isDashboardTotalEarningsPromptHyRu,
  isTopStaffRevenuePrompt,
  isTotalEarningsPrompt,
  STAFF_ROLE_WORDS,
} from './dashboard-revenue-analytics.util.js';
import {
  NEGATIVE_EARNINGS_SCENARIOS,
  TOP_SPECIALIST_REVENUE_SCENARIOS,
  TOTAL_EARNINGS_SCENARIOS,
} from './dashboard-revenue-analytics.fixtures.js';

describe('dashboard-revenue-analytics.util', () => {
  it.each(
    TOTAL_EARNINGS_SCENARIOS.map((scenario) => [scenario.id, scenario.prompt]),
  )('detects total earnings prompt %s', (_id, prompt) => {
    expect(isTotalEarningsPrompt(prompt)).toBe(true);
    expect(isTopStaffRevenuePrompt(prompt)).toBe(false);
  });

  it.each(
    TOP_SPECIALIST_REVENUE_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario.prompt,
    ]),
  )('detects top specialist revenue prompt %s', (_id, prompt) => {
    expect(isTopStaffRevenuePrompt(prompt)).toBe(true);
    expect(isTotalEarningsPrompt(prompt)).toBe(false);
  });

  it.each(NEGATIVE_EARNINGS_SCENARIOS.map((prompt) => [prompt]))(
    'rejects non-analytics prompt "%s"',
    (prompt) => {
      expect(isTotalEarningsPrompt(prompt)).toBe(false);
      expect(isTopStaffRevenuePrompt(prompt)).toBe(false);
    },
  );

  it('matches staff role words for provider synonyms', () => {
    for (const word of [
      'specialist',
      'specialists',
      'provider',
      'stylist',
      'therapist',
      'employee',
      'staff',
    ]) {
      expect(STAFF_ROLE_WORDS.test(`top ${word} revenue`)).toBe(true);
    }
  });

  it('detects each total earnings pattern branch', () => {
    expect(isTotalEarningsPrompt('Calculate total earnings for today')).toBe(
      true,
    );
    expect(isTotalEarningsPrompt('How much did we earn last month?')).toBe(
      true,
    );
    expect(isTotalEarningsPrompt('Total revenue this week')).toBe(true);
  });

  it('detects staff revenue via role words and top-ranking phrases', () => {
    expect(isTopStaffRevenuePrompt('Provider revenue ranking today')).toBe(
      true,
    );
    expect(isTopStaffRevenuePrompt('Who made the most revenue today?')).toBe(
      true,
    );
    expect(isTopStaffRevenuePrompt('Most revenue by stylist last week')).toBe(
      true,
    );
  });

  it('detects Armenian and Russian total earnings prompts', () => {
    expect(isTotalEarningsPrompt('Օրվա ընդհանուր եկամուտը')).toBe(true);
    expect(isTotalEarningsPrompt('Сколько мы заработали за сегодня?')).toBe(
      true,
    );
    expect(isTotalEarningsPrompt('Общая выручка за месяц')).toBe(true);
    expect(isTotalEarningsPrompt('Total booking revenue this month')).toBe(
      true,
    );
  });

  it('excludes provider-personal HY/RU prompts from dashboard total earnings', () => {
    expect(isTotalEarningsPrompt('Իմ եկամուտը անցյալ ամիս')).toBe(false);
    expect(isTotalEarningsPrompt('Моя выручка за прошлый месяц')).toBe(false);
    expect(
      isDashboardTotalEarningsPromptHyRu(
        'Top 3 specialists by revenue last week',
      ),
    ).toBe(false);
    expect(isDashboardTotalEarningsPromptHyRu('Իմ եկամուտը անցյալ ամիս')).toBe(
      false,
    );
    expect(
      isDashboardTotalEarningsPromptHyRu(
        'Ցույց տուր իմ ցուցանիշները այս շաբաթ',
      ),
    ).toBe(false);
  });

  it('excludes customer recommend-specialists prompts from staff revenue analytics', () => {
    expect(
      isTopStaffRevenuePrompt('Suggest top specialists for haircut on Monday'),
    ).toBe(false);
    expect(
      isTotalEarningsPrompt('Top 3 specialists by revenue last week'),
    ).toBe(false);
  });
});
