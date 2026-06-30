import { describe, expect, it } from 'vitest';
import { providerMobileGuide } from './mobile-guide/index.ts';
import {
  PROVIDER_CLINIC_GUIDE_TOPIC_ID,
  PROVIDER_GUIDE_GATING_SCENARIOS,
  PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID,
} from './provider-guide-gating.fixtures.js';
import {
  buildProviderGuideListContext,
  isProviderGuideTopicVisible,
  sanitizeProviderGuideTopicId,
} from './provider-guide.util.js';
import {
  resolveProviderClinicNavState,
  type ProviderClinicNavState,
} from './use-provider-clinic-nav.js';

describe('provider guide gating (ai-guide-1.9.9)', () => {
  it.each(PROVIDER_GUIDE_GATING_SCENARIOS)(
    'matches clinic nav + TOC for $id',
    ({ membershipRole, labFeaturesEnabled, showTeamManagerGuide, showClinicGuide }) => {
      const clinicNav = resolveProviderClinicNavState(labFeaturesEnabled);
      expect(clinicNav.showClinicTabs).toBe(showClinicGuide);
      expect(clinicNav.showLabCollection).toBe(showClinicGuide);
      expect(clinicNav.showLabResults).toBe(showClinicGuide);
      expect(clinicNav.showClinicTasks).toBe(showClinicGuide);
      expect(clinicNav.showPatients).toBe(showClinicGuide);

      const ctx = { membershipRole, labFeaturesEnabled };
      const topics = providerMobileGuide.listGuideTopics(buildProviderGuideListContext(ctx));

      expect(topics.some((row) => row.topicId === PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID)).toBe(
        showTeamManagerGuide,
      );
      expect(topics.some((row) => row.topicId === PROVIDER_CLINIC_GUIDE_TOPIC_ID)).toBe(
        showClinicGuide,
      );
    },
  );

  it.each(PROVIDER_GUIDE_GATING_SCENARIOS)(
    'sanitizes hidden topic deep links for $id',
    ({ membershipRole, labFeaturesEnabled, showTeamManagerGuide, showClinicGuide }) => {
      const ctx = { membershipRole, labFeaturesEnabled };

      expect(sanitizeProviderGuideTopicId(PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID, ctx)).toBe(
        showTeamManagerGuide ? PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID : null,
      );
      expect(isProviderGuideTopicVisible(PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID, ctx)).toBe(
        showTeamManagerGuide,
      );

      expect(sanitizeProviderGuideTopicId(PROVIDER_CLINIC_GUIDE_TOPIC_ID, ctx)).toBe(
        showClinicGuide ? PROVIDER_CLINIC_GUIDE_TOPIC_ID : null,
      );
      expect(isProviderGuideTopicVisible(PROVIDER_CLINIC_GUIDE_TOPIC_ID, ctx)).toBe(
        showClinicGuide,
      );
    },
  );

  it('keeps general topics visible for every role and clinic state', () => {
    for (const scenario of PROVIDER_GUIDE_GATING_SCENARIOS) {
      const ctx = {
        membershipRole: scenario.membershipRole,
        labFeaturesEnabled: scenario.labFeaturesEnabled,
      };
      expect(isProviderGuideTopicVisible('provider-getting-started', ctx)).toBe(true);
      expect(sanitizeProviderGuideTopicId('provider-tabs', ctx)).toBe('provider-tabs');
    }
  });
});

describe('resolveProviderClinicNavState', () => {
  it('mirrors lab feature flag across clinic tabs', () => {
    const enabled: ProviderClinicNavState = resolveProviderClinicNavState(true);
    expect(enabled).toEqual({
      showClinicTabs: true,
      showLabCollection: true,
      showLabResults: true,
      showClinicTasks: true,
      showPatients: true,
    });

    const disabled = resolveProviderClinicNavState(false);
    expect(disabled.showClinicTabs).toBe(false);
    expect(disabled.showLabCollection).toBe(false);
  });
});
