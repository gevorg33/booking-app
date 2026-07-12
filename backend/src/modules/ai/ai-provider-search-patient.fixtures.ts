/** ai-cmd-provider-5.19.1 — search/lookup patients by name or phone. */

export const PROVIDER_SEARCH_PATIENT_CLASSIFIER_RULES = `- search_patient: READ — clinic only: search/lookup patients across the clinic by name or phone fragment. Optional query. Triggers: find patient Jane Doe, lookup by phone ending 4521, search for patients named John. NOT open_patient_chart (already-identified patient's full chart), NOT summarize_client (booking-scoped snapshot).`;

export const SEARCH_PATIENT_PROMPT_SCENARIOS = [
  {
    id: 'search-patient-find-jane-en',
    prompt: 'Find patient Jane Doe',
    surface: 'provider' as const,
    expectedAction: 'search_patient',
    paramsPartial: { query: 'Jane Doe' },
  },
  {
    id: 'search-patient-phone-ending-en',
    prompt: 'Lookup by phone ending 4521',
    surface: 'provider' as const,
    expectedAction: 'search_patient',
    paramsPartial: { query: '4521' },
  },
  {
    id: 'search-patient-named-en',
    prompt: 'Search for patients named John',
    surface: 'provider' as const,
    expectedAction: 'search_patient',
    paramsPartial: { query: 'John' },
  },
  {
    id: 'search-patient-hy',
    prompt: 'Փնտրել հիվանդ Jane Doe',
    surface: 'provider' as const,
    expectedAction: 'search_patient',
  },
  {
    id: 'search-patient-ru',
    prompt: 'Найти пациента Jane Doe',
    surface: 'provider' as const,
    expectedAction: 'search_patient',
  },
] as const;
