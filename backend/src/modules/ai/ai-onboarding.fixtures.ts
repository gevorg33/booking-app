/** ai-cmd-dashboard-6.2 — onboarding wizard classifier appendix. */
export const ONBOARDING_CLASSIFIER_RULES = `- explain_onboarding_status: READ — current onboarding step, business type, whether catalog/schedule are set up, and available business types. Triggers: onboarding status, what step of onboarding are we on, which business types are available.
- set_business_type: MUTATE — set the business type for onboarding (businessType required, optional notes). Triggers: set our business type to salon, we are a spa, I run a clinic.
- recommend_catalog: READ — AI/template-generated starter service catalog suggestion for the business type. Triggers: recommend a catalog, suggest services for us. NOT apply_onboarding_catalog (actually applies it).
- apply_onboarding_catalog: MUTATE — apply the recommended (or explicitly given) catalog to the business. Triggers: apply the recommended catalog, use that catalog. NOT recommend_catalog (read-only suggestion), NOT bulk_create_catalog (manual catalog entry, not the onboarding wizard).
- apply_onboarding_schedule: MUTATE — apply the default onboarding schedule template. Triggers: apply the default schedule, apply schedule for onboarding. NOT apply_schedule (existing template-to-calendar application, unrelated to the onboarding wizard).
- skip_onboarding_schedule: MUTATE — skip the onboarding schedule setup step. Triggers: skip the schedule step, skip schedule setup.
- apply_onboarding_playbook: MUTATE — apply the vertical playbook (business-type-specific catalog + schedule bundle) for onboarding. Triggers: apply the playbook, apply our vertical playbook. NOT apply_clinic_playbook / apply_tour_playbook (those are dedicated clinic/tour setup flows, not the generic onboarding wizard).
- complete_onboarding: MUTATE — mark onboarding complete. Triggers: finish onboarding, complete onboarding, we're done setting up.
- Examples:
  - "What step of onboarding are we on?" → explain_onboarding_status
  - "We are a spa" → set_business_type, businessType=spa
  - "Recommend a catalog for us" → recommend_catalog
  - "Apply the recommended catalog" → apply_onboarding_catalog
  - "Skip the schedule step" → skip_onboarding_schedule
  - "Finish onboarding" → complete_onboarding`;
