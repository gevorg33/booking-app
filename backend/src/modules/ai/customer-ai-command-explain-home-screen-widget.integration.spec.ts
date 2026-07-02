import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS } from './ai-explain-home-screen-widget.fixtures.js';
import { EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_SCENARIOS } from './ai-explain-home-screen-widget-multilingual.fixtures.js';

describe('customer-ai-command explain_home_screen_widget integration (ai-cmd-customer-4.13.6)', () => {
  it.each(
    [
      ...EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS,
      ...EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues explain_home_screen_widget for $0', (_id, prompt) => {
    expect(rescueConsumerAdoptionIntent(prompt, 'unknown')?.action).toBe(
      'explain_home_screen_widget',
    );
  });
});
