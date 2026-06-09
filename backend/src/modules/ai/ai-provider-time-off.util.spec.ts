import {
  rescueDashboardTimeOffIntent,
  rescueProviderTimeOffIntent,
} from './ai-provider-time-off.util.js';
import { SIMILAR_DASHBOARD_TIME_OFF_PROMPTS } from '../provider-mobile/provider-time-off.fixtures.js';

describe('ai-provider-time-off.util (prov-exp-7.2)', () => {
  it.each(SIMILAR_DASHBOARD_TIME_OFF_PROMPTS.map((s) => [s.id, s]))(
    'rescues dashboard prompt %s',
    (_id, scenario) => {
      expect(
        rescueDashboardTimeOffIntent(scenario.prompt, 'unknown')?.action,
      ).toBe(scenario.expectedAction);
    },
  );

  it('rescues provider request and list prompts', () => {
    expect(
      rescueProviderTimeOffIntent('Request next Friday off', 'unknown')?.action,
    ).toBe('request_time_off');
    expect(
      rescueProviderTimeOffIntent('Did my vacation get approved?', 'unknown')
        ?.action,
    ).toBe('list_my_time_off_requests');
  });

  it('returns null when action already classified', () => {
    expect(
      rescueDashboardTimeOffIntent('anything', 'list_time_off_requests'),
    ).toBeNull();
    expect(
      rescueProviderTimeOffIntent('anything', 'request_time_off'),
    ).toBeNull();
  });

  it('returns null for unrelated prompts', () => {
    expect(rescueDashboardTimeOffIntent('hello team', 'unknown')).toBeNull();
    expect(rescueProviderTimeOffIntent('hello team', 'unknown')).toBeNull();
  });
});
