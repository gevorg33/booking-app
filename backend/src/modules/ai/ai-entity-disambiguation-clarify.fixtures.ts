import type { ClassificationSurface } from './ai-classification-engine.types.js';
import type { EntityClarifyField, EntityClarifyOption } from './ai-entity-disambiguation-clarify.util.js';

export interface EntityDisambiguationScenario {
  id: string;
  prompt: string;
  surface: ClassificationSurface;
  action: string;
  params?: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  employees?: Array<{ id: string; name: string }>;
  services?: Array<{ id: string; name: string }>;
  customers?: Array<{ id: string; name: string }>;
  expectClarify: boolean;
  expectField?: EntityClarifyField;
  expectOptionLabels?: string[];
  expectSummaryIncludes?: string;
  expectOptionCountAtLeast?: number;
}

/** acc-4.3 — ambiguous catalog entity → selectable chips, not free-text re-ask. */
export const ENTITY_DISAMBIGUATION_SCENARIOS: EntityDisambiguationScenario[] = [
  {
    id: 'dash-two-annas',
    prompt: 'book massage with Anna tomorrow',
    surface: 'dashboard',
    action: 'create_booking',
    employees: [
      { id: 'e1', name: 'Anna Smith' },
      { id: 'e2', name: 'Anna Jones' },
    ],
    services: [{ id: 's1', name: 'Swedish Massage' }],
    expectClarify: true,
    expectField: 'employeeName',
    expectOptionLabels: ['Anna Smith', 'Anna Jones'],
    expectSummaryIncludes: 'provider',
  },
  {
    id: 'dash-three-massages',
    prompt: 'book a massage tomorrow at 10',
    surface: 'dashboard',
    action: 'create_booking',
    employees: [{ id: 'e1', name: 'Gevorg' }],
    services: [
      { id: 's1', name: 'Swedish Massage' },
      { id: 's2', name: 'Deep Tissue Massage' },
      { id: 's3', name: 'Hot Stone Massage' },
    ],
    expectClarify: true,
    expectField: 'serviceName',
    expectOptionCountAtLeast: 3,
    expectSummaryIncludes: 'service',
  },
  {
    id: 'dash-customer-two-janes',
    prompt: 'cancel booking for Jane',
    surface: 'dashboard',
    action: 'cancel_bookings',
    customers: [
      { id: 'c1', name: 'Jane Doe' },
      { id: 'c2', name: 'Jane Roe' },
    ],
    expectClarify: true,
    expectField: 'customerName',
    expectOptionLabels: ['Jane Doe', 'Jane Roe'],
    expectSummaryIncludes: 'customer',
  },
  {
    id: 'customer-two-annas',
    prompt: 'book with Anna next week',
    surface: 'customer',
    action: 'book_appointment',
    employees: [
      { id: 'e1', name: 'Anna Smith' },
      { id: 'e2', name: 'Anna Lee' },
    ],
    expectClarify: true,
    expectField: 'employeeName',
    expectOptionLabels: ['Anna Smith', 'Anna Lee'],
  },
  {
    id: 'customer-three-massages',
    prompt: 'I want a massage on Friday',
    surface: 'customer',
    action: 'book_appointment',
    services: [
      { id: 's1', name: 'Relaxation Massage' },
      { id: 's2', name: 'Sports Massage' },
      { id: 's3', name: 'Aromatherapy Massage' },
    ],
    expectClarify: true,
    expectField: 'serviceName',
    expectOptionCountAtLeast: 3,
  },
  {
    id: 'public-two-annas',
    prompt: 'book appointment with Anna',
    surface: 'public',
    action: 'book_appointment',
    employees: [
      { id: 'e1', name: 'Anna Smith' },
      { id: 'e2', name: 'Anna Jones' },
    ],
    expectClarify: true,
    expectField: 'employeeName',
    expectOptionLabels: ['Anna Smith', 'Anna Jones'],
  },
  {
    id: 'public-three-massages',
    prompt: 'check availability for massage tomorrow',
    surface: 'public',
    action: 'check_availability',
    services: [
      { id: 's1', name: 'Classic Massage' },
      { id: 's2', name: 'Thai Massage' },
      { id: 's3', name: 'Prenatal Massage' },
    ],
    expectClarify: true,
    expectField: 'serviceName',
    expectOptionCountAtLeast: 3,
  },
  {
    id: 'provider-two-services',
    prompt: 'block time for facial tomorrow',
    surface: 'provider',
    action: 'block_time',
    services: [
      { id: 's1', name: 'Classic Facial' },
      { id: 's2', name: 'Hydrating Facial' },
      { id: 's3', name: 'Anti-Aging Facial' },
    ],
    expectClarify: true,
    expectField: 'serviceName',
    expectOptionCountAtLeast: 3,
  },
  {
    id: 'dash-anna-resolved-memory',
    prompt: 'book massage with Anna tomorrow',
    surface: 'dashboard',
    action: 'create_booking',
    sessionContext: { _clarifyMemory: { employeeName: 'Anna Smith' } },
    employees: [
      { id: 'e1', name: 'Anna Smith' },
      { id: 'e2', name: 'Anna Jones' },
    ],
    expectClarify: false,
  },
  {
    id: 'dash-single-anna-no-clarify',
    prompt: 'book with Anna tomorrow',
    surface: 'dashboard',
    action: 'create_booking',
    employees: [{ id: 'e1', name: 'Anna Smith' }],
    expectClarify: false,
  },
];

export const ENTITY_DISAMBIGUATION_FIXTURE_CATALOG: Record<
  string,
  Pick<EntityDisambiguationScenario, 'employees' | 'services' | 'customers'>
> = Object.fromEntries(
  ENTITY_DISAMBIGUATION_SCENARIOS.map((scenario) => [
    scenario.id,
    {
      employees: scenario.employees,
      services: scenario.services,
      customers: scenario.customers,
    },
  ]),
);

export function entityOptionsForScenario(
  scenario: EntityDisambiguationScenario,
): EntityClarifyOption[] {
  return (scenario.expectOptionLabels ?? []).map((label, index) => ({
    id: `fixture-${index}`,
    field: scenario.expectField ?? 'employeeName',
    label,
    value: label,
  }));
}
