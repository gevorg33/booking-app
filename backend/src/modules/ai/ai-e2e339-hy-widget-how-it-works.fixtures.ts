/**
 * e2e-bug.339 — HY "Ինչպես է աշխատում հիմնական էկրանի վիջեթը" ("How does the
 * home screen widget work") must route to `explain_home_screen_widget`, not
 * fall through to `booking_help`. The HY semantic gate in
 * `isExplainHomeScreenWidgetPrompt` required ավելացնել/ցույց/կրկին
 * (add/show/again) alongside վիջեթ/հիմնական էկրան, which this natural
 * "how does it work" phrasing lacks — mirrors EN's `/\bhow\b/` + `/\bwidget\b/`
 * fallback and RU's "работа" cue.
 */

export type E2e339WidgetHowItWorksCase = {
  id: string;
  prompt: string;
  expectWidgetExplain: boolean;
};

export const E2E339_WIDGET_HOW_IT_WORKS_CASES: readonly E2e339WidgetHowItWorksCase[] =
  [
    {
      id: 'e339-hy-exact-reported-repro',
      prompt: 'Ինչպես է աշխատում հիմնական էկրանի վիջեթը',
      expectWidgetExplain: true,
    },
    {
      id: 'e339-hy-how-to-remove-widget',
      prompt: 'Ինչպես հեռացնել վիջեթը',
      expectWidgetExplain: true,
    },
    {
      id: 'e339-hy-how-home-screen-works',
      prompt: 'Ինչպես է աշխատում հիմնական էկրանը',
      expectWidgetExplain: true,
    },
    {
      id: 'e339-en-regression-how-does-it-work',
      prompt: 'How does the home screen widget work?',
      expectWidgetExplain: true,
    },
    {
      id: 'e339-ru-regression-how-does-it-work',
      prompt: 'Как работает виджет на главном экране',
      expectWidgetExplain: true,
    },
    {
      id: 'e339-hy-regression-what-shows',
      prompt: 'Ինչ է ցույց տալիս վիջեթը',
      expectWidgetExplain: true,
    },
    {
      id: 'e339-hy-regression-add-widget',
      prompt: 'Ավելացնել հաջորդ հանդիպումը հիմնական էկրանին',
      expectWidgetExplain: true,
    },
  ] as const;

/** Controls — unrelated "how" phrasing without a widget noun must stay excluded. */
export const E2E339_UNRELATED_HOW_CONTROL_CASES: readonly E2e339WidgetHowItWorksCase[] =
  [
    {
      id: 'e339-hy-unrelated-how-to-book',
      prompt: 'Ինչպես ամրագրել',
      expectWidgetExplain: false,
    },
    {
      id: 'e339-hy-unrelated-how-to-cancel',
      prompt: 'Ինչպես չեղարկել ամրագրումը',
      expectWidgetExplain: false,
    },
  ] as const;
