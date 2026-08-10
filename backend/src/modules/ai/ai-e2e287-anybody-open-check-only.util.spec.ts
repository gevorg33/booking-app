import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  E2E287_INDEFINITE_CHECK_PROVIDERS,
  E2E287_NAMED_CHECK_AVAILABILITY,
  E2E287_PUBLIC_CHECK_AVAILABILITY,
} from './ai-e2e287-anybody-open-check-only.fixtures.js';
import { isCheckProvidersForServicePrompt } from './ai-payments.util.js';
import {
  disambiguateMisclassifiedAvailabilityIntent,
  resolveAvailabilityIntentFromPrompt,
} from './ai-intent-disambiguation.util.js';

describe('e2e-bug.287 anybody-open check-only → check_providers_for_service', () => {
  const rescue = new AiIntentRescueService();

  it.each(
    E2E287_INDEFINITE_CHECK_PROVIDERS.map((row) => [row.id, row] as const),
  )('detector: $id is check_providers prompt', (_id, row) => {
    expect(isCheckProvidersForServicePrompt(row.prompt)).toBe(true);
  });

  it.each(
    E2E287_INDEFINITE_CHECK_PROVIDERS.filter(
      (row) => row.surface !== 'public',
    ).map((row) => [row.id, row] as const),
  )('resolve $id → check_providers_for_service', (_id, row) => {
    expect(
      resolveAvailabilityIntentFromPrompt(row.surface, row.prompt)?.action,
    ).toBe('check_providers_for_service');
  });

  it.each(
    E2E287_INDEFINITE_CHECK_PROVIDERS.filter(
      (row) =>
        row.fromAction === 'check_availability' && row.surface !== 'public',
    ).map((row) => [row.id, row] as const),
  )('disambiguate $id check_availability → check_providers', (_id, row) => {
    const fix = disambiguateMisclassifiedAvailabilityIntent(
      row.surface,
      row.prompt,
      'check_availability',
      {},
    );
    expect(fix?.action).toBe('check_providers_for_service');
  });

  it.each(
    E2E287_INDEFINITE_CHECK_PROVIDERS.map((row) => [row.id, row] as const),
  )('rescue $id → $expectedAction', (_id, row) => {
    const result = rescue.rescue({
      prompt: row.prompt,
      action: row.fromAction,
      params: {},
      surface: row.surface,
    });
    expect(result?.action ?? row.fromAction).toBe(row.expectedAction);
    if (row.expectRescueReason && result?.rescued) {
      expect(result.rescueReason).toBe(row.expectRescueReason);
    }
  });

  it.each(E2E287_NAMED_CHECK_AVAILABILITY.map((row) => [row.id, row] as const))(
    'named/browse $id stays/remaps to check_availability',
    (_id, row) => {
      expect(isCheckProvidersForServicePrompt(row.prompt)).toBe(false);
      const result = rescue.rescue({
        prompt: row.prompt,
        action: row.fromAction,
        params: {},
        surface: row.surface,
      });
      expect(result?.action ?? row.fromAction).toBe(row.expectedAction);
      if (row.expectRescueReason && result?.rescued) {
        expect(result.rescueReason).toBe(row.expectRescueReason);
      }
    },
  );

  it.each(
    E2E287_PUBLIC_CHECK_AVAILABILITY.map((row) => [row.id, row] as const),
  )('public $id → check_availability', (_id, row) => {
    const result = rescue.rescue({
      prompt: row.prompt,
      action: row.fromAction,
      params: {},
      surface: row.surface,
    });
    expect(result?.action ?? row.fromAction).toBe(row.expectedAction);
    if (row.expectRescueReason && result?.rescued) {
      expect(result.rescueReason).toBe(row.expectRescueReason);
    }
  });

  it('does not let public alias steal dashboard check_providers', () => {
    const prompt = 'is anybody open tomorrow morning for Swedish massage';
    const result = rescue.rescue({
      prompt,
      action: 'check_providers_for_service',
      params: {},
      surface: 'dashboard',
    });
    expect(result?.action ?? 'check_providers_for_service').toBe(
      'check_providers_for_service',
    );
    expect(result?.rescueReason).not.toBe('public_availability');
  });
});
