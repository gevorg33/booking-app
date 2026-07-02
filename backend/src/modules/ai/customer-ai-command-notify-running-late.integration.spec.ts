import { rescueNotifyRunningLateIntent } from './ai-notify-running-late.util.js';
import { NOTIFY_RUNNING_LATE_RESCUE_SCENARIOS } from './ai-notify-running-late.fixtures.js';

describe('customer-ai-command notify_running_late integration (ai-cmd-customer-4.4.6)', () => {
  it.each(NOTIFY_RUNNING_LATE_RESCUE_SCENARIOS)(
    'rescues notify_running_late for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueNotifyRunningLateIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );
});
