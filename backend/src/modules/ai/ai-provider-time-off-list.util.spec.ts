import { SIMILAR_PROVIDER_TIME_OFF_LIST_PROMPTS } from '../provider-mobile/provider-time-off.fixtures.js';
import { PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS } from './ai-provider-time-off-list-multilingual.fixtures.js';
import {
  isListMyTimeOffRequestsPrompt,
  isRequestTimeOffPrompt,
  matchProviderTimeOffListScenario,
  rescueProviderTimeOffIntent,
} from './ai-provider-time-off.util.js';

describe('ai-provider-time-off.util (prov-exp-7.2)', () => {
  it.each(SIMILAR_PROVIDER_TIME_OFF_LIST_PROMPTS)(
    'maps list fixture prompt $id to list_my_time_off_requests',
    (scenario) => {
      expect(rescueProviderTimeOffIntent(scenario.prompt, 'unknown')).toEqual({
        action: 'list_my_time_off_requests',
        rescueReason: 'my_time_off_list',
      });
    },
  );

  it.each(PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS)(
    'exact-matches list i18n prompt $id',
    (scenario) => {
      expect(matchProviderTimeOffListScenario(scenario.prompt)).toEqual({
        action: 'list_my_time_off_requests',
        rescueReason: 'my_time_off_list',
      });
    },
  );

  it('rescues provider request prompt without stealing list prompts', () => {
    expect(
      rescueProviderTimeOffIntent('Request next Friday off', 'unknown')?.action,
    ).toBe('request_time_off');
    expect(isRequestTimeOffPrompt('Request next Friday off')).toBe(true);
    expect(isListMyTimeOffRequestsPrompt('Request next Friday off')).toBe(
      false,
    );
  });

  it('returns null when action already classified', () => {
    expect(
      rescueProviderTimeOffIntent('anything', 'list_my_time_off_requests'),
    ).toBeNull();
    expect(
      rescueProviderTimeOffIntent('anything', 'request_time_off'),
    ).toBeNull();
  });
});
