import {
  assertRoleCapabilityListingProbes,
  buildRoleCapabilityListing,
  buildRoleCapabilityListingResult,
  isRoleCapabilityListingPrompt,
  rescueListCapabilitiesIntent,
  ROLE_CAPABILITY_LISTING_PROBE_BOUNDS,
  ROLE_CAPABILITY_LISTING_SCENARIOS,
} from './ai-role-capability-listing.util.js';

describe('ai-role-capability-listing (parity-3.7)', () => {
  it.each(ROLE_CAPABILITY_LISTING_SCENARIOS)(
    '$id — prompt detection',
    (scenario) => {
      expect(isRoleCapabilityListingPrompt(scenario.prompt)).toBe(
        scenario.expectDetect,
      );
    },
  );

  it('owner lists more dashboard features than staff', () => {
    const owner = buildRoleCapabilityListing(
      ROLE_CAPABILITY_LISTING_PROBE_BOUNDS.ownerDashboard,
    );
    const staff = buildRoleCapabilityListing(
      ROLE_CAPABILITY_LISTING_PROBE_BOUNDS.staffDashboard,
    );
    expect(owner.features.length).toBeGreaterThan(staff.features.length);
    expect(owner.allowedIntentCount).toBeGreaterThan(staff.allowedIntentCount);
  });

  it('buildRoleCapabilityListingResult wires discovery metadata', () => {
    const result = buildRoleCapabilityListingResult(
      ROLE_CAPABILITY_LISTING_PROBE_BOUNDS.ownerDashboard,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('list_capabilities');
    expect(result.details.roleCapabilityListing).toBe(true);
    expect(result.details.featureCount).toBeGreaterThan(0);
    expect(result.summary).toMatch(/Here's what I can help with/i);
  });

  it('rescueListCapabilitiesIntent maps unknown discovery prompts', () => {
    expect(
      rescueListCapabilitiesIntent('What can you do?', 'unknown')?.action,
    ).toBe('list_capabilities');
    expect(
      rescueListCapabilitiesIntent('Book tomorrow', 'create_booking'),
    ).toBeNull();
  });

  it('passes role capability listing probe gate', () => {
    const status = assertRoleCapabilityListingProbes();
    expect(status.complete).toBe(true);
  });
});
