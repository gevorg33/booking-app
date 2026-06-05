export type HipaaAnswer = 'yes' | 'no' | 'unsure';

export type HipaaEvalDecision = 'defer' | 'wellness_only' | 'pursue_baa';

export interface HipaaChecklistItem {
  id: string;
  category: 'phi_scope' | 'legal' | 'technical' | 'operational';
  /** When true, answering "yes" is a blocker for pursuing HIPAA BAA positioning. */
  blockerOnYes: boolean;
  /** Points toward readiness when answered "yes". */
  readinessOnYes: number;
}

export const HIPAA_CHECKLIST: HipaaChecklistItem[] = [
  {
    id: 'handles_phi',
    category: 'phi_scope',
    blockerOnYes: false,
    readinessOnYes: 0,
  },
  {
    id: 'us_patients',
    category: 'phi_scope',
    blockerOnYes: false,
    readinessOnYes: 0,
  },
  {
    id: 'diagnosis_documentation',
    category: 'phi_scope',
    blockerOnYes: true,
    readinessOnYes: 0,
  },
  {
    id: 'baa_with_vendors',
    category: 'legal',
    blockerOnYes: false,
    readinessOnYes: 15,
  },
  {
    id: 'privacy_officer',
    category: 'legal',
    blockerOnYes: false,
    readinessOnYes: 10,
  },
  {
    id: 'encryption_at_rest',
    category: 'technical',
    blockerOnYes: false,
    readinessOnYes: 15,
  },
  {
    id: 'encryption_in_transit',
    category: 'technical',
    blockerOnYes: false,
    readinessOnYes: 10,
  },
  {
    id: 'access_audit_logs',
    category: 'technical',
    blockerOnYes: false,
    readinessOnYes: 15,
  },
  {
    id: 'mfa_admin_access',
    category: 'technical',
    blockerOnYes: false,
    readinessOnYes: 10,
  },
  {
    id: 'staff_hipaa_training',
    category: 'operational',
    blockerOnYes: false,
    readinessOnYes: 10,
  },
  {
    id: 'incident_response_plan',
    category: 'operational',
    blockerOnYes: false,
    readinessOnYes: 10,
  },
  {
    id: 'minimum_necessary_policy',
    category: 'operational',
    blockerOnYes: false,
    readinessOnYes: 5,
  },
];

export const HIPAA_READINESS_MAX = HIPAA_CHECKLIST.reduce(
  (sum, item) => sum + item.readinessOnYes,
  0,
);

export const HIPAA_RECOMMENDATION_KEYS: Record<HipaaEvalDecision, string> = {
  defer: 'strategyEval.hipaa.recDefer',
  wellness_only: 'strategyEval.hipaa.recWellnessOnly',
  pursue_baa: 'strategyEval.hipaa.recPursueBaa',
};
