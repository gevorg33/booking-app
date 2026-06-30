import { useProviderLabFeaturesEnabled } from './use-provider-lab-features.js';

/** Clinic tab visibility — parity with ProviderBottomTabBar (ai-guide-1.9.9). */
export interface ProviderClinicNavState {
  showClinicTabs: boolean;
  showLabCollection: boolean;
  showLabResults: boolean;
  showClinicTasks: boolean;
  showPatients: boolean;
}

export function resolveProviderClinicNavState(
  labFeaturesEnabled: boolean,
): ProviderClinicNavState {
  return {
    showClinicTabs: labFeaturesEnabled,
    showLabCollection: labFeaturesEnabled,
    showLabResults: labFeaturesEnabled,
    showClinicTasks: labFeaturesEnabled,
    showPatients: labFeaturesEnabled,
  };
}

export function useProviderClinicNav(): ProviderClinicNavState {
  const labFeaturesEnabled = useProviderLabFeaturesEnabled();
  return resolveProviderClinicNavState(labFeaturesEnabled);
}
