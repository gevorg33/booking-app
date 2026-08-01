import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  isExplainHomeScreenWidgetPrompt,
  rescueExplainHomeScreenWidgetIntent,
} from './ai-explain-home-screen-widget.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import {
  isListMyUpcomingAppointmentsPrompt,
  rescueListMyUpcomingAppointmentsIntent,
} from './ai-list-my-upcoming-appointments.util.js';
import {
  E2E295_HOME_TAB_NO_STEAL,
  E2E295_LIST_UPCOMING_CONTROLS,
  E2E295_SURFACES,
  E2E295_UNKNOWN_AND_OTHER_MISROUTES,
  E2E295_WIDGET_FROM_LIST_MISROUTES,
} from './ai-e2e295-home-screen-widget-vs-upcoming.fixtures.js';

describe('e2e-bug.295 home-screen widget vs list_my_upcoming', () => {
  const rescue = new AiIntentRescueService();

  it.each(E2E295_WIDGET_FROM_LIST_MISROUTES)(
    'detector + util rescue $id',
    ({ prompt, fromAction, expectedAction }) => {
      expect(isExplainHomeScreenWidgetPrompt(prompt)).toBe(true);
      expect(isListMyUpcomingAppointmentsPrompt(prompt)).toBe(false);
      expect(
        rescueListMyUpcomingAppointmentsIntent(prompt, 'unknown'),
      ).toBeNull();
      expect(
        rescueExplainHomeScreenWidgetIntent(prompt, fromAction)?.action,
      ).toBe(expectedAction);
      expect(rescueConsumerAdoptionIntent(prompt, fromAction)?.action).toBe(
        expectedAction,
      );
    },
  );

  it.each(E2E295_WIDGET_FROM_LIST_MISROUTES)(
    'AiIntentRescueService classified-phase $id',
    ({ prompt, fromAction, expectedAction }) => {
      for (const surface of E2E295_SURFACES) {
        const rescued = rescue.rescue({
          prompt,
          action: fromAction,
          params: {},
          surface,
        });
        expect(rescued?.action).toBe(expectedAction);
        expect(rescued?.rescued).toBe(true);
      }
    },
  );

  it.each(E2E295_UNKNOWN_AND_OTHER_MISROUTES)(
    'AiIntentRescueService remaps $id',
    ({ prompt, fromAction, expectedAction }) => {
      for (const surface of E2E295_SURFACES) {
        const rescued = rescue.rescue({
          prompt,
          action: fromAction,
          params: {},
          surface,
        });
        expect(rescued?.action).toBe(expectedAction);
      }
    },
  );

  it.each(E2E295_LIST_UPCOMING_CONTROLS)(
    'list upcoming control still detects $id',
    ({ prompt, expectedAction }) => {
      expect(isListMyUpcomingAppointmentsPrompt(prompt)).toBe(true);
      expect(isExplainHomeScreenWidgetPrompt(prompt)).toBe(false);
      expect(
        rescueListMyUpcomingAppointmentsIntent(prompt, 'unknown')?.action,
      ).toBe(expectedAction);
      for (const surface of E2E295_SURFACES) {
        const rescued = rescue.rescue({
          prompt,
          action: 'unknown',
          params: {},
          surface,
        });
        expect(rescued?.action).toBe(expectedAction);
      }
    },
  );

  it.each(E2E295_HOME_TAB_NO_STEAL)(
    'home-tab control is not widget $id',
    ({ prompt }) => {
      expect(isExplainHomeScreenWidgetPrompt(prompt)).toBe(false);
    },
  );
});
