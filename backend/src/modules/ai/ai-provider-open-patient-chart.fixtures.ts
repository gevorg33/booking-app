/** ai-cmd-provider-5.11.4 — provider mobile: open/summarize a patient's clinical chart before their visit/draw. */

export const PROVIDER_OPEN_PATIENT_CHART_CLASSIFIER_RULES = `- open_patient_chart: READ — clinic only: thin provider-surface alias of the dashboard "explain_patient_chart" capability — open/summarize a patient's clinical chart (allergies, chronic problems, recent visits, pending results/orders) before their draw or visit. Requires customerName. Triggers: open chart for Jane, show Jane's patient chart, open the patient chart for John. NOT explain_client_intake (pre-visit questionnaire, not clinical chart), NOT list_booking_lab_summaries (this booking's lab tests only, not the full chart).`;

export const PROVIDER_OPEN_PATIENT_CHART_PROMPT_SCENARIOS = [
  {
    id: 'open-patient-chart-open-for-en',
    prompt: 'Open chart for Jane',
    surface: 'provider' as const,
    expectedAction: 'open_patient_chart',
  },
  {
    id: 'open-patient-chart-show-jane-en',
    prompt: "Show Jane's patient chart",
    surface: 'provider' as const,
    expectedAction: 'open_patient_chart',
  },
  {
    id: 'open-patient-chart-open-patient-chart-en',
    prompt: 'Open the patient chart for John',
    surface: 'provider' as const,
    expectedAction: 'open_patient_chart',
  },
  {
    id: 'open-patient-chart-open-maria-en',
    prompt: 'Open chart for Maria',
    surface: 'provider' as const,
    expectedAction: 'open_patient_chart',
  },
  {
    id: 'open-patient-chart-summarize-sam-en',
    prompt: 'Summarize the patient chart for Sam',
    surface: 'provider' as const,
    expectedAction: 'open_patient_chart',
  },
  {
    id: 'open-patient-chart-pull-up-en',
    prompt: "Pull up Maria's chart",
    surface: 'provider' as const,
    expectedAction: 'open_patient_chart',
  },
  {
    id: 'open-patient-chart-hy',
    prompt: 'Բացատրիր հիվանդի քարտը for Jane',
    surface: 'provider' as const,
    expectedAction: 'open_patient_chart',
  },
  {
    id: 'open-patient-chart-ru',
    prompt: 'Покажи карту пациента for Jane',
    surface: 'provider' as const,
    expectedAction: 'open_patient_chart',
  },
] as const;
