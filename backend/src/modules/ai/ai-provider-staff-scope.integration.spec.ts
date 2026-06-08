import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  DASHBOARD_STAFF_SCOPE_SCENARIOS,
  PROVIDER_STAFF_SCOPE_SCENARIOS,
} from './ai-provider-staff-scope.fixtures.js';

describe('parity-2.2 staff scope integration', () => {
  const rescue = new AiIntentRescueService();

  it.each(PROVIDER_STAFF_SCOPE_SCENARIOS)(
    'rescues provider scenario $id',
    ({ prompt, expectedAction }) => {
      const result = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(result?.action).toBe(expectedAction);
      expect(result?.rescued).toBe(true);
    },
  );

  it.each(DASHBOARD_STAFF_SCOPE_SCENARIOS)(
    'rescues dashboard staff scenario $id',
    ({ prompt, expectedAction }) => {
      const result = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(result?.action).toBe(expectedAction);
      expect(result?.rescued).toBe(true);
    },
  );

  it('merges check-in status param on dashboard rescue', () => {
    const result = rescue.rescue({
      prompt: 'Check in my 10am appointment',
      action: 'unknown',
      params: {},
    });
    expect(result?.action).toBe('update_bookings');
    expect(result?.params.status).toBe('in_progress');
  });
});
