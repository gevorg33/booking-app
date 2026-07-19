/** ai-cmd-provider-5.18.3 — mark one leg of a multi-service booking done (per-leg status within the group). */

export const PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_CLASSIFIER_RULES = `- mark_multi_service_step_done: MUTATE — provider mobile only: mark one leg of a multi-service booking group as complete, not the whole visit. Requires bookingId (session, any leg of the group) and/or customerName, plus stepIndex (1-based) or serviceName identifying which leg. Triggers: finish step 1 of spa day, complete blowdry leg, finish step 2. NOT mark_visit_complete (finishes the entire visit), NOT update_bookings (generic status branch).`;

export const PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_PROMPT_SCENARIOS = [
  { id: 'mark-multi-service-step-done-step1-spa-day-en', prompt: 'Finish step 1 of spa day', surface: 'provider' as const, expectedAction: 'mark_multi_service_step_done', paramsPartial: { stepIndex: 1 } },
  { id: 'mark-multi-service-step-done-complete-blowdry-leg-en', prompt: 'Complete blowdry leg', surface: 'provider' as const, expectedAction: 'mark_multi_service_step_done', paramsPartial: { serviceName: 'blowdry' } },
  { id: 'mark-multi-service-step-done-step2-en', prompt: 'Finish step 2', surface: 'provider' as const, expectedAction: 'mark_multi_service_step_done', paramsPartial: { stepIndex: 2 } },
  { id: 'mark-multi-service-step-done-complete-manicure-leg-en', prompt: 'Complete the manicure leg', surface: 'provider' as const, expectedAction: 'mark_multi_service_step_done', paramsPartial: { serviceName: 'manicure' } },
  { id: 'mark-multi-service-step-done-hy', prompt: 'Ավարտված է 1-ին քայլը', surface: 'provider' as const, expectedAction: 'mark_multi_service_step_done' },
  { id: 'mark-multi-service-step-done-ru', prompt: 'Завершён первый этап', surface: 'provider' as const, expectedAction: 'mark_multi_service_step_done' },
] as const;
