import {
  E2E190_CHECK_AVAILABILITY_PROMPTS,
  E2E190_TEAM_WIDE_STAYS_PROVIDERS,
  resolveCustomerAvailabilityActionLabel,
  shouldExecuteCheckAvailabilityDeterministically,
} from './ai-e2e190-check-availability-reachable.util.js';
import { isPublicOnlyAssistantAction } from './ai-public-only-assistant-actions.js';

describe('e2e-bug.190 check_availability reachable', () => {
  it.each(
    E2E190_CHECK_AVAILABILITY_PROMPTS.map((row) => [row.id, row] as const),
  )('keeps classified check_availability for %s', (_id, row) => {
    expect(resolveCustomerAvailabilityActionLabel(row.classifiedAction)).toBe(
      row.expectedAction,
    );
    expect(
      shouldExecuteCheckAvailabilityDeterministically(row.expectedAction),
    ).toBe(true);
    expect(isPublicOnlyAssistantAction(row.expectedAction)).toBe(true);
  });

  it.each(
    E2E190_TEAM_WIDE_STAYS_PROVIDERS.map((row) => [row.id, row] as const),
  )('does not force team-wide providers into check_availability %s', (_id, row) => {
    expect(resolveCustomerAvailabilityActionLabel(row.classifiedAction)).toBe(
      row.expectedAction,
    );
    expect(
      shouldExecuteCheckAvailabilityDeterministically(row.classifiedAction),
    ).toBe(false);
    expect(isPublicOnlyAssistantAction(row.expectedAction)).toBe(false);
  });

  it('never remaps check_availability to check_providers_for_service', () => {
    expect(resolveCustomerAvailabilityActionLabel('check_availability')).toBe(
      'check_availability',
    );
    expect(resolveCustomerAvailabilityActionLabel('check_availability')).not.toBe(
      'check_providers_for_service',
    );
  });
});
