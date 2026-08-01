import {
  E2E77_CROSS_SURFACE_SCENARIOS,
  E2E77_PROVIDER_STILL_MATCHES,
} from './ai-e2e77-cross-surface-rescue-gate.fixtures.js';
import { acceptRescueForSurface } from './ai-intent-rescue-pipeline.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { isListUpcomingBookingsPrompt } from './ai-provider-schedule-reads.util.js';
import { isIntentAllowedOnSurface } from './ai-command-registry.util.js';
import { isPublicOnlyAssistantAction } from './ai-public-only-assistant-actions.js';

describe('e2e-bug.77 cross-surface rescue gates', () => {
  const rescue = new AiIntentRescueService();

  it('acceptRescueForSurface rejects provider/dashboard actions on customer', () => {
    expect(
      acceptRescueForSurface(
        {
          action: 'list_upcoming_bookings',
          params: {},
          rescued: true,
          rescueReason: 'list_upcoming_bookings',
        },
        'customer',
      ),
    ).toBeNull();
    expect(
      acceptRescueForSurface(
        {
          action: 'cancel_all_upcoming_bookings',
          params: {},
          rescued: true,
          rescueReason: 'cancel_all_upcoming_bookings',
        },
        'customer',
      )?.action,
    ).toBe('cancel_all_upcoming_bookings');
  });

  it('e2e-bug.189 — acceptRescueForSurface keeps public-only discovery on customer', () => {
    expect(
      acceptRescueForSurface(
        {
          action: 'list_providers',
          params: {},
          rescued: true,
          rescueReason: 'list_providers_roster',
        },
        'customer',
      )?.action,
    ).toBe('list_providers');
    expect(isPublicOnlyAssistantAction('list_providers')).toBe(true);
  });

  it('list_upcoming detector excludes cancel phrasing', () => {
    expect(
      isListUpcomingBookingsPrompt('cancel all my upcoming bookings'),
    ).toBe(false);
    expect(isListUpcomingBookingsPrompt('upcoming bookings for today')).toBe(
      true,
    );
  });

  it.each(E2E77_CROSS_SURFACE_SCENARIOS)(
    '$id: rescues to $expectedAction and not blocked steals',
    ({ prompt, surface, expectedAction, blockedActions }) => {
      for (const fromAction of ['unknown', ...blockedActions] as const) {
        const result = rescue.rescue({
          prompt,
          action: fromAction,
          params: {},
          surface,
        });
        expect(result?.action).toBe(expectedAction);
        for (const blocked of blockedActions) {
          expect(result?.action).not.toBe(blocked);
          expect(isIntentAllowedOnSurface(blocked, surface)).toBe(false);
        }
        const expectedAllowed =
          isIntentAllowedOnSurface(expectedAction, surface) ||
          (surface === 'public' &&
            isIntentAllowedOnSurface(expectedAction, 'customer')) ||
          (surface === 'customer' &&
            isPublicOnlyAssistantAction(expectedAction));
        expect(expectedAllowed).toBe(true);
      }
    },
  );

  it.each(E2E77_PROVIDER_STILL_MATCHES)(
    '$id: provider surface still gets schedule reads',
    ({ prompt, expectedAction }) => {
      const result = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        surface: 'provider',
      });
      expect(result?.action).toBe(expectedAction);
    },
  );
});
