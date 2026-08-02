import { E2E322_HEADER_CASES } from './ai-e2e322-list-trim-header-normalize.fixtures.js';
import { stripServiceRoleNoise } from './ai-orchestration.helpers.js';
import { normalizeAvailabilityServiceCategory } from './ai-flexible-availability.util.js';

/**
 * Mirrors the exact header expression used in
 * public-booking-assistant.service.ts's list_services handler:
 * `Our ${normalizeAvailabilityServiceCategory(stripServiceRoleNoise(String(serviceQuery)))} service types:`
 */
function buildHeaderCategory(serviceQuery: string): string {
  return normalizeAvailabilityServiceCategory(
    stripServiceRoleNoise(serviceQuery),
  );
}

describe('e2e-bug.322 list header normalizes raw classifier token', () => {
  it.each(E2E322_HEADER_CASES)(
    'normalizes header category for $id',
    ({ rawToken, expectHeaderCategory }) => {
      expect(buildHeaderCategory(rawToken)).toBe(expectHeaderCategory);
    },
  );

  it('does not change already-correct category labels (massage, facial)', () => {
    expect(buildHeaderCategory('massage')).toBe('massage');
    expect(buildHeaderCategory('facial')).toBe('facial');
  });

  it('leaves multi-word category phrases untouched (pass-through)', () => {
    expect(buildHeaderCategory('deep tissue massage')).toBe(
      'deep tissue massage',
    );
  });
});
