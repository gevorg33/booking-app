/**
 * e2e-bug.337 — HY "Բացատրի՛ր …" (with the ՛ emphasis mark, U+055B, inserted
 * mid-imperative) must still route to explain_clinic_services, not get
 * stolen by explain_business_hours_and_location's `hasHoursCue` guard, whose
 * negative lookahead was written against the unmarked citation-form spelling
 * ("ատրիր") and silently failed to exclude the real-world emphasized form.
 */

export type E2e337EmphasisMarkCase = {
  id: string;
  prompt: string;
  expectClinicExplain: boolean;
  expectHoursExplain: boolean;
};

export const E2E337_CLINIC_EMPHASIS_CASES: readonly E2e337EmphasisMarkCase[] = [
  {
    id: 'e337-hy-emphasis-bare-clinic-services',
    prompt: 'Բացատրի՛ր մեր կլինիկական ծառայությունները',
    expectClinicExplain: true,
    expectHoursExplain: false,
  },
  {
    id: 'e337-hy-emphasis-clinic-services-and-departments',
    prompt: 'Բացատրի՛ր մեր կլինիկական ծառայությունները և բաժինները',
    expectClinicExplain: true,
    expectHoursExplain: false,
  },
  {
    id: 'e337-hy-no-emphasis-clinic-services-regression',
    prompt: 'Բացատրիր մեր կլինիկական ծառայությունները և բաժինները',
    expectClinicExplain: true,
    expectHoursExplain: false,
  },
  {
    id: 'e337-en-regression-clinic-services',
    prompt: 'Explain our clinic services and department counts',
    expectClinicExplain: true,
    expectHoursExplain: false,
  },
] as const;

/** Controls — real hours questions and unrelated imperatives must be unaffected. */
export const E2E337_HOURS_AND_OTHER_IMPERATIVE_CONTROL_CASES: readonly E2e337EmphasisMarkCase[] =
  [
    {
      id: 'e337-hy-real-hours-question',
      prompt: 'Ինչ ժամեր եք բաց',
      expectClinicExplain: false,
      expectHoursExplain: true,
    },
    {
      id: 'e337-hy-real-hours-question-emphasis',
      prompt: 'Ինչ ժամեր եք բա՛ց',
      expectClinicExplain: false,
      expectHoursExplain: true,
    },
    {
      id: 'e337-hy-unrelated-open-doors-imperative',
      prompt: 'Բացիր դռները',
      expectClinicExplain: false,
      expectHoursExplain: false,
    },
    {
      id: 'e337-hy-unrelated-open-doors-imperative-emphasis',
      prompt: 'Բա՛ցիր դռները',
      expectClinicExplain: false,
      expectHoursExplain: false,
    },
  ] as const;
