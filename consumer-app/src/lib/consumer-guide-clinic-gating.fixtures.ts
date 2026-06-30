/** Clinic guide gating scenarios — parity with Results / Lab tabs (ai-guide-1.9.6). */
export interface ConsumerGuideClinicGatingScenario {
  id: string;
  businessType: string | undefined;
  showClinicGuide: boolean;
}

export const CONSUMER_GUIDE_CLINIC_GATING_SCENARIOS: readonly ConsumerGuideClinicGatingScenario[] =
  [
    { id: 'clinic', businessType: 'clinic', showClinicGuide: true },
    { id: 'polyclinic', businessType: 'polyclinic', showClinicGuide: true },
    { id: 'beauty-clinic', businessType: 'beauty_clinic', showClinicGuide: true },
    { id: 'dental', businessType: 'dental', showClinicGuide: true },
    { id: 'hair-salon', businessType: 'hair_salon', showClinicGuide: false },
    { id: 'tour-operator', businessType: 'tour_operator', showClinicGuide: false },
    { id: 'missing-business-type', businessType: undefined, showClinicGuide: false },
  ] as const;

export const CONSUMER_CLINIC_GUIDE_TOPIC_ID = 'consumer-clinic' as const;
