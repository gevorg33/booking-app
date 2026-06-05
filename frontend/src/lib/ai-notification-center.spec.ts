import { describe, expect, it } from 'vitest';
import {
  createAiAlert,
  markAlertRead,
  pushAiAlert,
  unreadAlertCount,
} from './ai-notification-center';

describe('ai-notification-center', () => {
  it('pushes and dedupes alerts', () => {
    const a = createAiAlert({
      alertType: 'conflict',
      title: 'Conflict',
      message: 'Overlap detected',
      taskId: 't1',
    });
    const next = pushAiAlert([], a);
    expect(next).toHaveLength(1);
    expect(pushAiAlert(next, a)).toHaveLength(1);
  });

  it('tracks unread count', () => {
    const alerts = [
      createAiAlert({ alertType: 'approval', title: 'A', message: 'm' }),
      createAiAlert({ alertType: 'report', title: 'B', message: 'm' }),
    ];
    expect(unreadAlertCount(alerts)).toBe(2);
    const read = markAlertRead(alerts, alerts[0].id);
    expect(unreadAlertCount(read)).toBe(1);
  });
});
