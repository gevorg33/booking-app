import { describe, expect, it } from '@jest/globals';
import {
  isBusinessProfileIntent,
  isGetDashboardOverviewPrompt,
  isUpdateBusinessProfilePrompt,
  rescueBusinessProfileIntent,
} from './ai-business-profile.util.js';

describe('ai-business-profile.util (ai-cmd-dashboard-6.2)', () => {
  it('recognizes the 2 business-profile intents', () => {
    expect(isBusinessProfileIntent('get_dashboard_overview')).toBe(true);
    expect(isBusinessProfileIntent('update_business_profile')).toBe(true);
    expect(isBusinessProfileIntent('cancel_bookings')).toBe(false);
  });

  it('detects dashboard overview prompts', () => {
    expect(isGetDashboardOverviewPrompt('show me the dashboard overview')).toBe(
      true,
    );
    expect(isGetDashboardOverviewPrompt("how's the business doing")).toBe(
      false,
    );
    expect(
      isGetDashboardOverviewPrompt('give me an overview of the business'),
    ).toBe(true);
  });

  it('detects update-business-profile prompts', () => {
    expect(
      isUpdateBusinessProfilePrompt('update our business phone number'),
    ).toBe(true);
    expect(isUpdateBusinessProfilePrompt('change the salon name')).toBe(true);
    expect(isUpdateBusinessProfilePrompt('cancel all bookings today')).toBe(
      false,
    );
  });

  describe('rescueBusinessProfileIntent', () => {
    it('returns null when already a business-profile intent', () => {
      expect(
        rescueBusinessProfileIntent('anything', 'get_dashboard_overview'),
      ).toBeNull();
    });

    it('rescues overview prompts', () => {
      expect(
        rescueBusinessProfileIntent('show the business overview', 'unknown'),
      ).toEqual({ action: 'get_dashboard_overview', rescueReason: 'overview' });
    });

    it('rescues update-profile prompts', () => {
      expect(
        rescueBusinessProfileIntent('update our business address', 'unknown'),
      ).toEqual({
        action: 'update_business_profile',
        rescueReason: 'update_profile',
      });
    });

    it('returns null for unrelated prompts', () => {
      expect(
        rescueBusinessProfileIntent('cancel all bookings today', 'unknown'),
      ).toBeNull();
    });
  });
});
