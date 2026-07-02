import { handleExplainAppUpdateRequiredLogic } from './ai-explain-app-update-required.logic.js';
import {
  EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS,
  EXPLAIN_APP_UPDATE_REQUIRED_RESCUE_SCENARIOS,
} from './ai-explain-app-update-required.fixtures.js';
import { rescueExplainAppUpdateRequiredIntent } from './ai-explain-app-update-required.util.js';

describe('ai-explain-app-update-required.logic (ai-cmd-customer-4.13.4)', () => {
  it.each(
    EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS.slice(0, 4).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles explain_app_update_required for $0', async (_id, prompt) => {
    const result = await handleExplainAppUpdateRequiredLogic(
      'biz-1',
      { appVersion: '1.0.0', nativePlatform: 'ios' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_app_update_required');
    expect(result.details?.consumerAppGate).toBe(true);
  });

  it('clarifies on unrecognized prompt', async () => {
    const result = await handleExplainAppUpdateRequiredLogic(
      'biz-1',
      {},
      'book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('uses params prompt fallback', async () => {
    const result = await handleExplainAppUpdateRequiredLogic('biz-1', {
      _prompt: 'Why must I update the app?',
      appVersion: '1.0.0',
      nativePlatform: 'android',
    });
    expect(result.success).toBe(true);
    expect(result.details?.aspect).toBe('why_update');
  });

  it('offers dismiss clientAction when nudge visible', async () => {
    const prevLatest = process.env.MOBILE_CONSUMER_IOS_LATEST_VERSION;
    process.env.MOBILE_CONSUMER_IOS_LATEST_VERSION = '2.0.0';
    process.env.MOBILE_CONSUMER_IOS_MIN_VERSION = '1.0.0';
    const result = await handleExplainAppUpdateRequiredLogic(
      'biz-1',
      {
        appVersion: '1.0.0',
        nativePlatform: 'ios',
      },
      'Skip this update',
    );
    if (prevLatest === undefined) {
      delete process.env.MOBILE_CONSUMER_IOS_LATEST_VERSION;
    } else {
      process.env.MOBILE_CONSUMER_IOS_LATEST_VERSION = prevLatest;
    }
    expect(result.success).toBe(true);
    expect(result.details?.clientAction).toBe('dismissConsumerAppUpdateNudge');
  });

  it.each(EXPLAIN_APP_UPDATE_REQUIRED_RESCUE_SCENARIOS)(
    'pipeline rescues explain_app_update_required for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainAppUpdateRequiredIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_app_update_required');
    },
  );
});
