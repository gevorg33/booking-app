export type MarketplacePositioningDecision =
  | 'software_only'
  | 'partner_directory'
  | 'full_marketplace'
  | 'undecided';

export interface MarketplaceCriterion {
  id: string;
  /** Weight when scoring each positioning option (1–5 importance from user). */
  defaultWeight: number;
}

export interface MarketplaceOptionProfile {
  id: MarketplacePositioningDecision;
  /** Score 0–100 for each criterion id. */
  scores: Record<string, number>;
}

export const MARKETPLACE_CRITERIA: MarketplaceCriterion[] = [
  { id: 'tenant_autonomy', defaultWeight: 4 },
  { id: 'new_client_acquisition', defaultWeight: 5 },
  { id: 'implementation_speed', defaultWeight: 4 },
  { id: 'brand_control', defaultWeight: 3 },
  { id: 'seo_discoverability', defaultWeight: 4 },
  { id: 'operational_complexity', defaultWeight: 3 },
  { id: 'marketplace_fees_tolerance', defaultWeight: 3 },
  { id: 'support_burden', defaultWeight: 3 },
];

export const MARKETPLACE_OPTION_PROFILES: MarketplaceOptionProfile[] = [
  {
    id: 'software_only',
    scores: {
      tenant_autonomy: 95,
      new_client_acquisition: 35,
      implementation_speed: 90,
      brand_control: 95,
      seo_discoverability: 40,
      operational_complexity: 90,
      marketplace_fees_tolerance: 100,
      support_burden: 85,
    },
  },
  {
    id: 'partner_directory',
    scores: {
      tenant_autonomy: 80,
      new_client_acquisition: 65,
      implementation_speed: 75,
      brand_control: 70,
      seo_discoverability: 80,
      operational_complexity: 70,
      marketplace_fees_tolerance: 85,
      support_burden: 70,
    },
  },
  {
    id: 'full_marketplace',
    scores: {
      tenant_autonomy: 45,
      new_client_acquisition: 95,
      implementation_speed: 50,
      brand_control: 40,
      seo_discoverability: 95,
      operational_complexity: 35,
      marketplace_fees_tolerance: 30,
      support_burden: 40,
    },
  },
];

export const MARKETPLACE_RECOMMENDATION_KEYS: Record<
  Exclude<MarketplacePositioningDecision, 'undecided'>,
  string
> = {
  software_only: 'strategyEval.marketplace.recSoftwareOnly',
  partner_directory: 'strategyEval.marketplace.recPartnerDirectory',
  full_marketplace: 'strategyEval.marketplace.recFullMarketplace',
};
