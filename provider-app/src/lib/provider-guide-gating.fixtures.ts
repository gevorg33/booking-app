/** Provider guide gating scenarios — ai-guide-1.9.9. */
export interface ProviderGuideGatingScenario {
  id: string;
  membershipRole: string | undefined;
  labFeaturesEnabled: boolean;
  showTeamManagerGuide: boolean;
  showClinicGuide: boolean;
}

export const PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID = 'provider-team-manager' as const;
export const PROVIDER_CLINIC_GUIDE_TOPIC_ID = 'provider-clinic' as const;

export const PROVIDER_GUIDE_GATING_SCENARIOS: readonly ProviderGuideGatingScenario[] = [
  {
    id: 'owner-clinic',
    membershipRole: 'owner',
    labFeaturesEnabled: true,
    showTeamManagerGuide: true,
    showClinicGuide: true,
  },
  {
    id: 'manager-clinic',
    membershipRole: 'manager',
    labFeaturesEnabled: true,
    showTeamManagerGuide: true,
    showClinicGuide: true,
  },
  {
    id: 'admin-clinic',
    membershipRole: 'admin',
    labFeaturesEnabled: true,
    showTeamManagerGuide: true,
    showClinicGuide: true,
  },
  {
    id: 'provider-clinic',
    membershipRole: 'provider',
    labFeaturesEnabled: true,
    showTeamManagerGuide: false,
    showClinicGuide: true,
  },
  {
    id: 'provider-salon',
    membershipRole: 'provider',
    labFeaturesEnabled: false,
    showTeamManagerGuide: false,
    showClinicGuide: false,
  },
  {
    id: 'owner-salon',
    membershipRole: 'owner',
    labFeaturesEnabled: false,
    showTeamManagerGuide: true,
    showClinicGuide: false,
  },
  {
    id: 'missing-role-salon',
    membershipRole: undefined,
    labFeaturesEnabled: false,
    showTeamManagerGuide: false,
    showClinicGuide: false,
  },
] as const;
