import {
  isCancelTimeOffRequestPrompt,
  rescueDashboardTimeOffIntent,
  rescueProviderTimeOffIntent,
} from './ai-provider-time-off.util.js';
import {
  SIMILAR_DASHBOARD_TIME_OFF_PROMPTS,
  SIMILAR_PROVIDER_TIME_OFF_PROMPTS,
} from '../provider-mobile/provider-time-off.fixtures.js';

describe('ai-provider-time-off.util (prov-exp-7.2)', () => {
  it.each(SIMILAR_DASHBOARD_TIME_OFF_PROMPTS.map((s) => [s.id, s]))(
    'rescues dashboard prompt %s',
    (_id, scenario) => {
      expect(
        rescueDashboardTimeOffIntent(scenario.prompt, 'unknown')?.action,
      ).toBe(scenario.expectedAction);
    },
  );

  it.each(SIMILAR_PROVIDER_TIME_OFF_PROMPTS.map((s) => [s.id, s]))(
    'rescues provider prompt %s',
    (_id, scenario) => {
      expect(
        rescueProviderTimeOffIntent(scenario.prompt, 'unknown')?.action,
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

  it('detects cancel_time_off_request prompts', () => {
    expect(isCancelTimeOffRequestPrompt('Cancel my time off request')).toBe(
      true,
    );
    expect(isCancelTimeOffRequestPrompt('Withdraw my vacation request')).toBe(
      true,
    );
    expect(isCancelTimeOffRequestPrompt('Cancel my PTO')).toBe(true);
    expect(isCancelTimeOffRequestPrompt('Request next Friday off')).toBe(
      false,
    );
    expect(
      isCancelTimeOffRequestPrompt('Did my vacation request get approved?'),
    ).toBe(false);
  });

  it('rescues cancel_time_off_request before list/request checks', () => {
    expect(
      rescueProviderTimeOffIntent('Cancel my time off request', 'unknown')
        ?.action,
    ).toBe('cancel_time_off_request');
    expect(
      rescueProviderTimeOffIntent('Withdraw my vacation request', 'unknown')
        ?.action,
    ).toBe('cancel_time_off_request');
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
