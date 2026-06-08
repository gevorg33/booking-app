import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  buildRoleCapabilityListingResult,
  ROLE_CAPABILITY_LISTING_PROBE_BOUNDS,
} from './ai-role-capability-listing.util.js';
import {
  CUSTOMER_INTENTS,
  DASHBOARD_INTENTS,
  PROVIDER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';

describe('ai-role-capability-listing integration (parity-3.7)', () => {
  const rescue = new AiIntentRescueService();

  it('registers list_capabilities on all four surfaces', () => {
    expect(DASHBOARD_INTENTS).toContain('list_capabilities');
    expect(PROVIDER_INTENTS).toContain('list_capabilities');
    expect(CUSTOMER_INTENTS).toContain('list_capabilities');
    expect(PUBLIC_INTENTS).toContain('list_capabilities');
  });

  it.each([
    ['dashboard', 'owner'],
    ['provider', 'staff'],
    ['customer', 'client'],
    ['public', 'client'],
  ] as const)(
    'buildRoleCapabilityListingResult returns grouped features for %s/%s',
    (surface, accessTier) => {
      const result = buildRoleCapabilityListingResult({
        surface,
        accessTier,
        planTierId: 'business',
      });
      expect(result.success).toBe(true);
      expect(result.action).toBe('list_capabilities');
      expect(result.details.roleCapabilityListing).toBe(true);
      expect(result.details.featureCount).toBeGreaterThan(0);
      expect(Object.keys(result.details.groupedByModule as object).length).toBeGreaterThan(0);
    },
  );

  it('owner dashboard lists more features than staff', () => {
    const owner = buildRoleCapabilityListingResult(
      ROLE_CAPABILITY_LISTING_PROBE_BOUNDS.ownerDashboard,
    );
    const staff = buildRoleCapabilityListingResult(
      ROLE_CAPABILITY_LISTING_PROBE_BOUNDS.staffDashboard,
    );
    expect(owner.details.featureCount).toBeGreaterThan(staff.details.featureCount);
  });

  it('rescues discovery prompts to list_capabilities', () => {
    const result = rescue.rescue({
      prompt: 'What can you do?',
      action: 'unknown',
      params: {},
      surface: 'dashboard',
    });
    expect(result?.action).toBe('list_capabilities');
    expect(result?.rescueReason).toBe('role_capability_discovery');
  });
});
