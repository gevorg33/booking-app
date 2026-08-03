import {
  E2E339_UNRELATED_HOW_CONTROL_CASES,
  E2E339_WIDGET_HOW_IT_WORKS_CASES,
} from './ai-e2e339-hy-widget-how-it-works.fixtures.js';
import {
  isExplainHomeScreenWidgetPrompt,
  rescueExplainHomeScreenWidgetIntent,
  resolveExplainHomeScreenWidgetAspect,
} from './ai-explain-home-screen-widget.util.js';

describe('e2e-bug.339: HY "how does it work" widget phrasing routes to explain_home_screen_widget', () => {
  it.each(
    E2E339_WIDGET_HOW_IT_WORKS_CASES.map((row) => [row.id, row] as const),
  )('%s', (_id, row) => {
    expect(isExplainHomeScreenWidgetPrompt(row.prompt)).toBe(
      row.expectWidgetExplain,
    );
    expect(
      rescueExplainHomeScreenWidgetIntent(row.prompt, 'booking_help')?.action,
    ).toBe('explain_home_screen_widget');
  });

  it('exact reported repro resolves how_it_works aspect', () => {
    expect(
      resolveExplainHomeScreenWidgetAspect(
        'Ինչպես է աշխատում հիմնական էկրանի վիջեթը',
      ),
    ).toBe('how_it_works');
  });

  it.each(
    E2E339_UNRELATED_HOW_CONTROL_CASES.map((row) => [row.id, row] as const),
  )('%s — stays excluded', (_id, row) => {
    expect(isExplainHomeScreenWidgetPrompt(row.prompt)).toBe(
      row.expectWidgetExplain,
    );
    expect(
      rescueExplainHomeScreenWidgetIntent(row.prompt, 'booking_help'),
    ).toBeNull();
  });
});
