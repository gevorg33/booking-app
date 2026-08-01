import { isIntentAllowedOnSurface } from './ai-command-registry.util';
import { COMMAND_REGISTRY_BY_ID } from './ai-command-registry.js';
import { AiIntentRescueService } from './ai-intent-rescue.service';

describe('debug', () => {
  it('traces', () => {
    console.log('allowed on provider', isIntentAllowedOnSurface('guide_user_flow', 'provider'));
    console.log('registry entry', COMMAND_REGISTRY_BY_ID.get('guide_user_flow'));
    console.log('allowed on dashboard', isIntentAllowedOnSurface('guide_user_flow', 'dashboard'));
    const svc = new AiIntentRescueService();
    const result = svc.rescue({
      prompt: 'How do I cancel all appointments for today?',
      action: 'cancel_bookings',
      params: {},
      surface: 'provider',
    });
    console.log('full rescue result', result);
  });
});
