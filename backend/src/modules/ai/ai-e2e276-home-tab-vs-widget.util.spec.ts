import { t } from '../../common/i18n/messages.js';
import { handleExplainHomeScreenWidgetLogic } from './ai-explain-home-screen-widget.logic.js';
import {
  isExplainHomeScreenWidgetPrompt,
  rescueExplainHomeScreenWidgetIntent,
} from './ai-explain-home-screen-widget.util.js';
import { rescueCustomerAppGuideIntent } from './ai-customer-product-guide.util.js';
import { rescueProductGuideIntent } from './ai-product-guide-rescue.util.js';
import {
  E2E276_HOME_TAB_RECLAIM_SCENARIOS,
  E2E276_WIDGET_CLARIFY_LOCALES,
  E2E276_WIDGET_TRUE_POSITIVES,
} from './ai-e2e276-home-tab-vs-widget.fixtures.js';

describe('e2e-bug.276 home tab vs home-screen widget', () => {
  it.each(E2E276_HOME_TAB_RECLAIM_SCENARIOS)(
    'rescueCustomerAppGuideIntent $id',
    ({ prompt, fromAction, expectedAction }) => {
      expect(rescueCustomerAppGuideIntent(prompt, fromAction)).toBe(
        expectedAction,
      );
    },
  );

  it.each(E2E276_HOME_TAB_RECLAIM_SCENARIOS)(
    'rescueProductGuideIntent customer $id',
    ({ prompt, fromAction, expectedAction }) => {
      const rescued = rescueProductGuideIntent(prompt, fromAction, {
        surface: 'customer',
      });
      expect(rescued.action).toBe(expectedAction);
      expect(rescued.rescueReason).toBe('customer_app_guide');
    },
  );

  it.each(E2E276_HOME_TAB_RECLAIM_SCENARIOS)(
    'isExplainHomeScreenWidgetPrompt false for $id',
    ({ prompt }) => {
      expect(isExplainHomeScreenWidgetPrompt(prompt)).toBe(false);
      expect(
        rescueExplainHomeScreenWidgetIntent(prompt, 'unknown'),
      ).toBeNull();
    },
  );

  it.each(E2E276_WIDGET_TRUE_POSITIVES)(
    'widget true positive still detects $id',
    ({ prompt }) => {
      expect(isExplainHomeScreenWidgetPrompt(prompt)).toBe(true);
      expect(
        rescueExplainHomeScreenWidgetIntent(prompt, 'unknown')?.action,
      ).toBe('explain_home_screen_widget');
      expect(rescueCustomerAppGuideIntent(prompt, 'unknown')).toBe('unknown');
    },
  );

  it.each(E2E276_WIDGET_CLARIFY_LOCALES)(
    'widget clarify localized for $id',
    async ({ locale, expectScript }) => {
      const result = await handleExplainHomeScreenWidgetLogic(
        'biz-1',
        { locale },
        'book a haircut tomorrow',
      );
      expect(result.success).toBe(false);
      expect(result.summary).toBe(
        t(locale, 'assistant.homeScreenWidgetClarify'),
      );
      if (expectScript === 'hy') {
        expect(result.summary).toMatch(/[\u0530-\u058F]/);
      } else if (expectScript === 'cyr') {
        expect(result.summary).toMatch(/[\u0400-\u04FF]/);
      } else {
        expect(result.summary).toMatch(/home screen widget/i);
      }
    },
  );
});
