import type { ClassificationSurface } from './ai-classification-engine.types.js';
import type { ResolvedCommand } from './command-completion.types.js';

/** acc-5.1 — minimum fuzzy match score before auto-binding name→id. */
export const RESOLUTION_CONFIDENCE_THRESHOLD = 0.72;

export interface ResolutionVerifyScenario {
  id: string;
  surface?: ClassificationSurface;
  resolved: ResolvedCommand;
  expectOk: boolean;
  expectFields?: string[];
  expectClarifyKind?: 'resolution_accuracy';
}

export interface ResolutionGuardSmartClarifyScenario {
  id: string;
  surface: ClassificationSurface;
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  employees?: Array<{ id: string; name: string }>;
  services?: Array<{ id: string; name: string }>;
  customers?: Array<{ id: string; name: string }>;
  resolved?: ResolvedCommand;
  expectClarify: boolean;
  expectField?: string;
  expectEntityOptions?: number;
}

export const RESOLUTION_VERIFY_SCENARIOS: ResolutionVerifyScenario[] = [
  {
    id: 'dash-employee-ambiguous',
    surface: 'dashboard',
    resolved: {
      action: 'create_booking',
      prompt: 'book massage with anna tomorrow',
      businessId: 'b1',
      reasoning: 'booking',
      params: { employeeName: 'Anna', serviceName: 'Massage' },
      enrichedParams: { employeeName: 'Anna', serviceName: 'Massage' },
      entities: {
        employees: [
          { id: 'e1', name: 'Anna Smith' } as any,
          { id: 'e2', name: 'Anna Jones' } as any,
        ],
        services: [{ id: 's1', name: 'Massage' } as any],
      },
    },
    expectOk: false,
    expectFields: ['employeeName'],
    expectClarifyKind: 'resolution_accuracy',
  },
  {
    id: 'dash-resolved-single-match',
    surface: 'dashboard',
    resolved: {
      action: 'create_booking',
      prompt: 'book massage with gevorg',
      businessId: 'b1',
      reasoning: 'booking',
      params: { employeeName: 'Gevorg', serviceName: 'Massage' },
      enrichedParams: {
        employeeId: 'e3',
        employeeName: 'Gevorg',
        serviceId: 's1',
        serviceName: 'Massage',
      },
      entities: {
        employee: { id: 'e3', name: 'Gevorg' } as any,
        employees: [{ id: 'e3', name: 'Gevorg' } as any],
        services: [{ id: 's1', name: 'Massage' } as any],
        employeeId: 'e3',
      },
    },
    expectOk: true,
  },
  {
    id: 'dash-silent-employee-pick',
    surface: 'dashboard',
    resolved: {
      action: 'create_booking',
      prompt: 'book massage with anna tomorrow',
      businessId: 'b1',
      reasoning: 'booking',
      params: { employeeName: 'Anna', serviceName: 'Massage' },
      enrichedParams: {
        employeeId: 'e1',
        employeeName: 'Anna Smith',
        serviceId: 's1',
        serviceName: 'Massage',
      },
      entities: {
        employees: [
          { id: 'e1', name: 'Anna Smith' } as any,
          { id: 'e2', name: 'Anna Jones' } as any,
        ],
        services: [{ id: 's1', name: 'Massage' } as any],
        employeeId: 'e1',
      },
    },
    expectOk: false,
    expectFields: ['employeeName'],
  },
  {
    id: 'dash-weak-employee-token',
    surface: 'dashboard',
    resolved: {
      action: 'create_booking',
      prompt: 'book massage with jo tomorrow',
      businessId: 'b1',
      reasoning: 'booking',
      params: { employeeName: 'Jo', serviceName: 'Massage' },
      enrichedParams: {
        employeeId: 'e1',
        employeeName: 'Jordan Lee',
        serviceId: 's1',
        serviceName: 'Massage',
        date: '2026-06-08',
      },
      entities: {
        employee: { id: 'e1', name: 'Jordan Lee' } as any,
        employees: [{ id: 'e1', name: 'Jordan Lee' } as any],
        services: [{ id: 's1', name: 'Massage' } as any],
      },
    },
    expectOk: false,
    expectFields: ['employeeName'],
  },
  {
    id: 'dash-service-ambiguous',
    surface: 'dashboard',
    resolved: {
      action: 'create_booking',
      prompt: 'book massage tomorrow',
      businessId: 'b1',
      reasoning: 'booking',
      params: { serviceName: 'massage' },
      enrichedParams: { serviceName: 'massage' },
      entities: {
        employees: [],
        services: [
          { id: 's1', name: 'Swedish Massage' } as any,
          { id: 's2', name: 'Deep Tissue Massage' } as any,
        ],
      },
    },
    expectOk: false,
    expectFields: ['serviceName'],
  },
  {
    id: 'dash-date-unresolved',
    surface: 'dashboard',
    resolved: {
      action: 'create_booking',
      prompt: 'book massage next week',
      businessId: 'b1',
      reasoning: 'booking',
      params: { serviceName: 'Massage', date: 'next week' },
      enrichedParams: { serviceName: 'Massage' },
      entities: {
        employees: [],
        services: [{ id: 's1', name: 'Massage' } as any],
      },
    },
    expectOk: false,
    expectFields: ['date'],
  },
  {
    id: 'dash-date-resolved-iso',
    surface: 'dashboard',
    resolved: {
      action: 'create_booking',
      prompt: 'book massage tomorrow',
      businessId: 'b1',
      reasoning: 'booking',
      params: { serviceName: 'Massage' },
      enrichedParams: {
        serviceId: 's1',
        serviceName: 'Massage',
        date: '2026-06-08',
      },
      entities: {
        employees: [],
        services: [{ id: 's1', name: 'Massage' } as any],
      },
    },
    expectOk: true,
  },
  {
    id: 'dash-customer-unresolved',
    surface: 'dashboard',
    resolved: {
      action: 'create_booking',
      prompt: 'book massage for maria tomorrow',
      businessId: 'b1',
      reasoning: 'booking',
      params: { customerName: 'Maria', serviceName: 'Massage' },
      enrichedParams: { serviceId: 's1', serviceName: 'Massage' },
      entities: {
        employees: [],
        services: [{ id: 's1', name: 'Massage' } as any],
      },
    },
    expectOk: false,
    expectFields: ['customerName'],
  },
  {
    id: 'customer-ambiguous-provider',
    surface: 'customer',
    resolved: {
      action: 'book_appointment',
      prompt: 'book massage with anna tomorrow',
      businessId: 'b1',
      reasoning: 'book',
      params: { employeeName: 'Anna', serviceName: 'Massage' },
      enrichedParams: { employeeName: 'Anna', serviceName: 'Massage' },
      entities: {
        employees: [
          { id: 'e1', name: 'Anna Smith' } as any,
          { id: 'e2', name: 'Anna Jones' } as any,
        ],
        services: [{ id: 's1', name: 'Massage' } as any],
      },
    },
    expectOk: false,
    expectFields: ['employeeName'],
  },
  {
    id: 'provider-weak-service-match',
    surface: 'provider',
    resolved: {
      action: 'list_my_bookings',
      prompt: 'show my facials this week',
      businessId: 'b1',
      reasoning: 'list',
      params: { serviceName: 'fac', dateFrom: '2026-06-01', dateTo: '2026-06-07' },
      enrichedParams: { serviceId: 's1', serviceName: 'Facial Treatment', dateFrom: '2026-06-01', dateTo: '2026-06-07' },
      entities: {
        employees: [],
        services: [{ id: 's1', name: 'Facial Treatment' } as any],
      },
    },
    expectOk: false,
    expectFields: ['serviceName'],
  },
  {
    id: 'public-service-exact',
    surface: 'public',
    resolved: {
      action: 'book_appointment',
      prompt: 'book swedish massage tomorrow evening',
      businessId: 'b1',
      reasoning: 'book',
      params: { serviceName: 'Swedish Massage' },
      enrichedParams: {
        serviceId: 's1',
        serviceName: 'Swedish Massage',
        date: '2026-06-08',
      },
      entities: {
        employees: [],
        services: [{ id: 's1', name: 'Swedish Massage' } as any],
      },
    },
    expectOk: true,
  },
  {
    id: 'public-date-missing',
    surface: 'public',
    resolved: {
      action: 'check_availability',
      prompt: 'who is free sometime next month for lashes',
      businessId: 'b1',
      reasoning: 'availability',
      params: { serviceName: 'Lashes' },
      enrichedParams: { serviceId: 's1', serviceName: 'Lashes' },
      entities: {
        employees: [],
        services: [{ id: 's1', name: 'Lashes' } as any],
      },
    },
    expectOk: false,
    expectFields: ['date'],
  },
];

export const RESOLUTION_GUARD_SMART_CLARIFY_SCENARIOS: ResolutionGuardSmartClarifyScenario[] = [
  {
    id: 'smart-dash-two-annas-resolved',
    surface: 'dashboard',
    prompt: 'book massage with Anna tomorrow',
    action: 'create_booking',
    params: { employeeName: 'Anna', serviceName: 'Massage' },
    employees: [
      { id: 'e1', name: 'Anna Smith' },
      { id: 'e2', name: 'Anna Jones' },
    ],
    services: [{ id: 's1', name: 'Massage' }],
    resolved: RESOLUTION_VERIFY_SCENARIOS[0]!.resolved,
    expectClarify: true,
    expectField: 'employeeName',
    expectEntityOptions: 2,
  },
  {
    id: 'smart-customer-params-fallback',
    surface: 'customer',
    prompt: 'book massage with Anna tomorrow',
    action: 'book_appointment',
    params: { employeeName: 'Anna', serviceName: 'Massage' },
    employees: [
      { id: 'e1', name: 'Anna Smith' },
      { id: 'e2', name: 'Anna Jones' },
    ],
    services: [{ id: 's1', name: 'Massage' }],
    expectClarify: true,
    expectField: 'employeeName',
  },
  {
    id: 'smart-public-clear-match',
    surface: 'public',
    prompt: 'book swedish massage tomorrow',
    action: 'book_appointment',
    params: { serviceName: 'Swedish Massage', date: '2026-06-08' },
    services: [{ id: 's1', name: 'Swedish Massage' }],
    expectClarify: false,
  },
];
