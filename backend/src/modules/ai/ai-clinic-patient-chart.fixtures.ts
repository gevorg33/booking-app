/** Dashboard classifier rules for patient chart read summaries (ai-cmd-clinic-v2-3). */
export const CLINIC_PATIENT_CHART_CLASSIFIER_RULES = `- explain_patient_chart: READ — clinic only: summarize a patient's chart — allergies, recent visits, pending lab results/orders. Triggers: explain/show/summarize + patient chart|chart summary|allergies|recent visits|pending results + customerName or customerId. NOT lookup_customer (generic CRM profile without chart context), NOT list_test_orders (lab queue), NOT list_bookings (all appointments), NOT explain_patient_chart on provider/customer surfaces (dashboard only).
- Examples:
  - "Explain Maria's patient chart" → explain_patient_chart, customerName=Maria
  - "Show allergies and last visits for Maria" → explain_patient_chart, customerName=Maria, focus=allergies,visits
  - "What pending lab results does Maria have on her chart?" → explain_patient_chart, customerName=Maria, focus=results`;

export const EXPLAIN_PATIENT_CHART_PROMPTS = [
  {
    id: 'maria-chart',
    prompt: "Explain Maria's patient chart",
    customerName: 'Maria',
  },
  {
    id: 'allergies-visits-maria',
    prompt: 'Show allergies and last visits for Maria',
    customerName: 'Maria',
    focus: ['allergies', 'visits'],
  },
  {
    id: 'pending-results-maria',
    prompt: 'What pending lab results does Maria have on her chart?',
    customerName: 'Maria',
    focus: ['results'],
  },
  {
    id: 'summarize-john',
    prompt: 'Summarize patient chart for John',
    customerName: 'John',
  },
  {
    id: 'allergies-visits-sofia',
    prompt: "Tell me about Sofia's allergies and recent visits",
    customerName: 'Sofia',
    focus: ['allergies', 'visits'],
  },
  {
    id: 'chart-allergies',
    prompt: 'Explain patient chart allergies for Anna',
    customerName: 'Anna',
    focus: ['allergies'],
  },
  {
    id: 'chart-summary-maria',
    prompt: "Show Maria's chart summary",
    customerName: 'Maria',
  },
  {
    id: 'what-chart-shows',
    prompt: "What does Maria's patient chart show?",
    customerName: 'Maria',
  },
  {
    id: 'review-chart-pending',
    prompt: "Review Maria's chart — allergies and pending results",
    customerName: 'Maria',
    focus: ['allergies', 'results'],
  },
  {
    id: 'open-labs-chart',
    prompt: 'Patient chart for Maria — last visits and open labs',
    customerName: 'Maria',
    focus: ['visits', 'results', 'orders'],
  },
  {
    id: 'question-chart',
    prompt: 'Can you explain the patient chart for James?',
    customerName: 'James',
  },
  {
    id: 'recent-visits-only',
    prompt: "List Maria's recent visits from her patient chart",
    customerName: 'Maria',
    focus: ['visits'],
  },
] as const;

export const CLINIC_PATIENT_CHART_RESCUE_SCENARIOS = [
  {
    id: 'lookup-customer-to-chart',
    prompt: "Explain Maria's patient chart",
    misclassifiedAction: 'lookup_customer',
    expectedAction: 'explain_patient_chart' as const,
  },
  {
    id: 'list-bookings-to-chart',
    prompt: 'Show allergies and last visits for Maria on her chart',
    misclassifiedAction: 'list_bookings',
    expectedAction: 'explain_patient_chart' as const,
  },
  {
    id: 'list-orders-to-chart',
    prompt: 'What pending lab results does Maria have on her chart?',
    misclassifiedAction: 'list_test_orders',
    expectedAction: 'explain_patient_chart' as const,
  },
] as const;
