import { handleExplainHomeScreenWidgetLogic } from './ai-explain-home-screen-widget.logic.js';
import {
  EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS,
  EXPLAIN_HOME_SCREEN_WIDGET_RESCUE_SCENARIOS,
} from './ai-explain-home-screen-widget.fixtures.js';
import { rescueExplainHomeScreenWidgetIntent } from './ai-explain-home-screen-widget.util.js';

describe('ai-explain-home-screen-widget.logic (ai-cmd-customer-4.13.6)', () => {
  it.each(
    EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS.slice(0, 4).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles explain_home_screen_widget for $0', async (_id, prompt) => {
    const result = await handleExplainHomeScreenWidgetLogic(
      'biz-1',
      { nativePlatform: 'ios', homeScreenWidgetSupported: true },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_home_screen_widget');
    expect(result.details?.consumerHomeScreenWidget).toBe(true);
  });

  it('clarifies on unrecognized prompt', async () => {
    const result = await handleExplainHomeScreenWidgetLogic(
      'biz-1',
      {},
      'book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('uses params prompt fallback and navigate for add widget', async () => {
    const result = await handleExplainHomeScreenWidgetLogic('biz-1', {
      _prompt: 'Add next appointment to home screen',
      nativePlatform: 'android',
    });
    expect(result.success).toBe(true);
    expect(result.details?.aspect).toBe('add_to_home_screen');
    expect(result.details?.navigate).toEqual({ path: 'account', query: {} });
  });

  it.each(EXPLAIN_HOME_SCREEN_WIDGET_RESCUE_SCENARIOS)(
    'pipeline rescues explain_home_screen_widget for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainHomeScreenWidgetIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_home_screen_widget');
    },
  );

  // e2e-bug.317 — success summary must be deterministic per-locale, not hardcoded English.
  describe('locale-aware success summaries (e2e-bug.317)', () => {
    it('returns Armenian copy under locale:hy for how_it_works', async () => {
      const result = await handleExplainHomeScreenWidgetLogic(
        'biz-1',
        { locale: 'hy', nativePlatform: 'ios' },
        'How does the home screen widget work?',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('home_screen_widget_snapshot');
      expect(result.summary).toMatch(/[԰-֏]/);
      expect(result.summary).not.toMatch(/The app builds/i);
    });

    it('returns Russian copy under locale:ru for add_to_home_screen', async () => {
      const result = await handleExplainHomeScreenWidgetLogic(
        'biz-1',
        {
          locale: 'ru',
          nativePlatform: 'ios',
          homeScreenWidgetSupported: true,
        },
        'Add next appointment to home screen',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toMatch(/[Ѐ-ӿ]/);
      expect(result.summary).not.toMatch(/On iPhone/i);
    });

    it('returns unsupported-platform copy in Armenian under locale:hy', async () => {
      const result = await handleExplainHomeScreenWidgetLogic(
        'biz-1',
        { locale: 'hy', homeScreenWidgetSupported: false, platform: 'web' },
        'Add next appointment to home screen',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('OptiSchedule Book');
      expect(result.summary).toMatch(/[԰-֏]/);
      expect(result.summary).not.toMatch(/Home-screen widgets are available/i);
    });

    it('interpolates the service name in Russian for what_shows with a next appointment', async () => {
      const result = await handleExplainHomeScreenWidgetLogic(
        'biz-1',
        {
          locale: 'ru',
          nativePlatform: 'ios',
          widgetAuthed: true,
          hasNextAppointment: true,
          nextServiceName: 'Массаж',
        },
        'What does the widget show?',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('Массаж');
      expect(result.summary).toMatch(/[Ѐ-ӿ]/);
    });

    it('defaults to English when locale is unset', async () => {
      const result = await handleExplainHomeScreenWidgetLogic(
        'biz-1',
        { nativePlatform: 'ios' },
        'How does the home screen widget work?',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toMatch(/The app builds a home_screen_widget_snapshot/);
    });
  });
});
