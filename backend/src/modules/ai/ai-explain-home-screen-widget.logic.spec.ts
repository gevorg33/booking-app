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
});
