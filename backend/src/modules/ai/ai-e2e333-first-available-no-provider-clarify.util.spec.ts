import { E2E333_PROMPT_HINT_CASES } from './ai-e2e333-first-available-no-provider-clarify.fixtures.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-booking-param-hints.util.js';
import { AiBookingCoreService } from './ai-booking-core.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';

describe('e2e-bug.333: first-available create_booking without a resolved provider clarifies, never a fake conflict', () => {
  it.each(
    E2E333_PROMPT_HINT_CASES.map((row) => [row.id, row] as const),
  )('%s', (_id, scenario) => {
    const params: Record<string, unknown> = {};
    enrichBookingTimeHintsFromPrompt('create_booking', params, scenario.prompt);
    expect(params.bookingFirstAvailable).toBe(scenario.expectFirstAvailable);
    expect(Boolean(params.allProviders)).toBe(scenario.expectAllProviders);
  });

  // pickCreateBookingFirstAvailable's zero-search-target validation is pure
  // w.r.t. injected repos/services (no DB access before the early return),
  // so a bare instance reproduces AiBookingCoreService's real call shape.
  const service = new AiBookingCoreService(
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
    undefined as any,
  );

  it('no employee resolved and allProviders unset asks the user to specify (never a fake conflict)', async () => {
    const result = await service.pickCreateBookingFirstAvailable(
      'biz-1',
      { id: 'svc-1', name: 'Deep tissue massage' } as any,
      {},
      [] as Employee[],
      undefined,
      'Create a booking for the first available massage slot',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.summary).toBe(
        'Specify a provider or say "any provider" for first-available booking.',
      );
    }
  });

  it('allProviders=true with zero active employees gets a distinct, non-misleading message', async () => {
    const result = await service.pickCreateBookingFirstAvailable(
      'biz-1',
      { id: 'svc-1', name: 'Deep tissue massage' } as any,
      { allProviders: true },
      [{ id: 'e1', isActive: false } as Employee],
      undefined,
      'Book any provider for the first available massage slot',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.summary).toBe(
        'No active providers found to search for availability.',
      );
    }
  });
});
