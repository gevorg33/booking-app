import {
  matchServicesByQuery,
  resolveEmployees,
  resolveServices,
} from '../ai-orchestration.helpers.js';
import { validateCommand } from '../command-completion.validator.js';
import type { ResolvedCommand } from '../command-completion.types.js';
import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './ai-command-eval.types.js';

/** acc-2.6 — ambiguity scenario kinds that should clarify, not execute. */
export type AmbiguityCorpusCategory =
  | 'missing_date'
  | 'missing_time'
  | 'missing_service'
  | 'missing_provider'
  | 'ambiguous_provider'
  | 'ambiguous_service'
  | 'vague_scope';

export type AmbiguityEvalKind = 'validation' | 'ambiguous_provider' | 'ambiguous_service';

export interface AmbiguityCorpusSeed {
  id: string;
  prompt: string;
  action: string;
  classifiedParams?: Record<string, unknown>;
  clarifyFields: string[];
  category: AmbiguityCorpusCategory;
  domain: string;
  locale?: AiCommandEvalCase['locale'];
  surface?: AiCommandEvalCase['surface'];
  evalKind?: AmbiguityEvalKind;
  compoundExpectEmpty?: boolean;
}

/** Minimum ambiguity corpus cases in CI (acc-2.6). */
export const ACC_EVAL_MIN_AMBIGUITY_CASES = 24;

export const ACC_EVAL_AMBIGUITY_CATEGORIES: AmbiguityCorpusCategory[] = [
  'missing_date',
  'missing_time',
  'missing_service',
  'missing_provider',
  'ambiguous_provider',
  'ambiguous_service',
  'vague_scope',
];

export const AMBIGUITY_EVAL_EMPLOYEES = [
  { id: 'emp-gevorg', name: 'Gevorg Gasparyan', isActive: true, serviceIds: [] },
  { id: 'emp-mary', name: 'Mary Torgomyan', isActive: true, serviceIds: [] },
  { id: 'emp-maria-lopez', name: 'Maria Lopez', isActive: true, serviceIds: [] },
  { id: 'emp-maria-santos', name: 'Maria Santos', isActive: true, serviceIds: [] },
  { id: 'emp-anna', name: 'Anna Kim', isActive: true, serviceIds: [] },
] as const;

export const AMBIGUITY_EVAL_SERVICES = [
  { id: 'svc-swedish', name: 'Swedish massage' },
  { id: 'svc-deep', name: 'Deep tissue massage' },
  { id: 'svc-facial', name: 'facemassage' },
  { id: 'svc-hot', name: 'Hot stone massage' },
  { id: 'svc-full', name: 'full body massage' },
  { id: 'svc-lashes', name: 'Permanent lashes' },
] as const;

/** acc-2.6 — prompts that should trigger clarify with expected missing/ambiguous fields. */
export const AMBIGUITY_CORPUS_SEEDS: AmbiguityCorpusSeed[] = [
  {
    id: 'book-missing-date',
    prompt: 'Book Swedish massage with Gevorg at 10:00',
    action: 'create_booking',
    classifiedParams: {
      employeeName: 'Gevorg Gasparyan',
      serviceName: 'Swedish massage',
      timeSlot: '10:00',
    },
    clarifyFields: ['date'],
    category: 'missing_date',
    domain: 'booking',
  },
  {
    id: 'book-missing-date-evening',
    prompt: 'Schedule facemassage with Mary tomorrow evening',
    action: 'create_booking',
    classifiedParams: {
      employeeName: 'Mary Torgomyan',
      serviceName: 'facemassage',
      timeOfDay: 'evening',
    },
    clarifyFields: ['date', 'timeSlot'],
    category: 'missing_date',
    domain: 'booking',
  },
  {
    id: 'book-missing-date-window',
    prompt: 'Book Swedish massage with Gevorg in the evening',
    action: 'create_booking',
    classifiedParams: {
      employeeName: 'Gevorg Gasparyan',
      serviceName: 'Swedish massage',
      timeOfDay: 'evening',
    },
    clarifyFields: ['date', 'timeSlot'],
    category: 'missing_date',
    domain: 'booking',
  },
  {
    id: 'package-book-missing-date',
    prompt: 'Book spa day package for Anna at 11:00',
    action: 'create_package_booking',
    classifiedParams: {
      packageName: 'Spa Day',
      customerName: 'Anna Kim',
      timeSlot: '11:00',
    },
    clarifyFields: ['date'],
    category: 'missing_date',
    domain: 'catalog',
  },
  {
    id: 'book-missing-time',
    prompt: 'Book Swedish massage with Gevorg tomorrow',
    action: 'create_booking',
    classifiedParams: {
      employeeName: 'Gevorg Gasparyan',
      serviceName: 'Swedish massage',
      date: '2026-06-08',
    },
    clarifyFields: ['timeSlot'],
    category: 'missing_time',
    domain: 'booking',
  },
  {
    id: 'book-missing-time-fixed-day',
    prompt: 'Schedule facemassage with Mary on 08/06/2026',
    action: 'create_booking',
    classifiedParams: {
      employeeName: 'Mary Torgomyan',
      serviceName: 'facemassage',
      date: '08_06_2026',
    },
    clarifyFields: ['timeSlot'],
    category: 'missing_time',
    domain: 'booking',
  },
  {
    id: 'multi-service-missing-time',
    prompt: 'Book haircut and beard trim with Gevorg tomorrow',
    action: 'create_multi_service_booking',
    classifiedParams: {
      employeeName: 'Gevorg Gasparyan',
      serviceNames: ['Swedish massage', 'facemassage'],
      date: '2026-06-08',
    },
    clarifyFields: ['timeSlot'],
    category: 'missing_time',
    domain: 'booking',
  },
  {
    id: 'book-missing-service',
    prompt: 'Book Gevorg tomorrow at 10:00',
    action: 'create_booking',
    classifiedParams: {
      employeeName: 'Gevorg Gasparyan',
      date: '2026-06-08',
      timeSlot: '10:00',
    },
    clarifyFields: ['serviceName'],
    category: 'missing_service',
    domain: 'booking',
  },
  {
    id: 'book-missing-date-and-time',
    prompt: 'Book facemassage with Mary',
    action: 'create_booking',
    classifiedParams: {
      employeeName: 'Mary Torgomyan',
      serviceName: 'facemassage',
    },
    clarifyFields: ['date', 'timeSlot'],
    category: 'missing_date',
    domain: 'booking',
  },
  {
    id: 'book-missing-provider',
    prompt: 'Book Swedish massage tomorrow at 10:00',
    action: 'create_booking',
    classifiedParams: {
      serviceName: 'Swedish massage',
      date: '2026-06-08',
      timeSlot: '10:00',
    },
    clarifyFields: ['employeeName'],
    category: 'missing_provider',
    domain: 'booking',
  },
  {
    id: 'book-missing-provider-and-date',
    prompt: 'Book Swedish massage at 10:00',
    action: 'create_booking',
    classifiedParams: {
      serviceName: 'Swedish massage',
      timeSlot: '10:00',
    },
    clarifyFields: ['employeeName', 'date'],
    category: 'missing_provider',
    domain: 'booking',
  },
  {
    id: 'ambiguous-provider-maria',
    prompt: 'Book massage with Maria tomorrow at 10:00',
    action: 'create_booking',
    classifiedParams: {
      employeeName: 'Maria',
      serviceName: 'Swedish massage',
      date: '2026-06-08',
      timeSlot: '10:00',
    },
    clarifyFields: ['employeeName'],
    category: 'ambiguous_provider',
    domain: 'booking',
    evalKind: 'ambiguous_provider',
  },
  {
    id: 'ambiguous-provider-maria-availability',
    prompt: 'Is Maria free for Swedish massage tomorrow at 14:00?',
    action: 'check_availability',
    classifiedParams: {
      employeeName: 'Maria',
      serviceName: 'Swedish massage',
      date: '2026-06-08',
      timeSlot: '14:00',
    },
    clarifyFields: ['employeeName'],
    category: 'ambiguous_provider',
    domain: 'booking',
    evalKind: 'ambiguous_provider',
  },
  {
    id: 'ambiguous-provider-mary-vs-maria',
    prompt: 'Clear schedule for Maria tomorrow',
    action: 'clear_schedule',
    classifiedParams: {
      employeeName: 'Maria',
      date: '2026-06-08',
    },
    clarifyFields: ['employeeName'],
    category: 'ambiguous_provider',
    domain: 'schedule',
    evalKind: 'ambiguous_provider',
  },
  {
    id: 'ambiguous-service-massage',
    prompt: 'Book massage with Gevorg tomorrow at 10:00',
    action: 'create_booking',
    classifiedParams: {
      employeeName: 'Gevorg Gasparyan',
      serviceName: 'massage',
      date: '2026-06-08',
      timeSlot: '10:00',
    },
    clarifyFields: ['serviceName'],
    category: 'ambiguous_service',
    domain: 'booking',
    evalKind: 'ambiguous_service',
  },
  {
    id: 'ambiguous-service-massage-availability',
    prompt: 'Who is free for massage tomorrow afternoon?',
    action: 'check_providers_for_service',
    classifiedParams: {
      serviceName: 'massage',
      date: '2026-06-08',
      timeOfDay: 'afternoon',
    },
    clarifyFields: ['serviceName'],
    category: 'ambiguous_service',
    domain: 'booking',
    evalKind: 'ambiguous_service',
  },
  {
    id: 'ambiguous-service-massage-cancel',
    prompt: 'Cancel all massage appointments tomorrow',
    action: 'cancel_bookings',
    classifiedParams: {
      serviceName: 'massage',
      date: '2026-06-08',
    },
    clarifyFields: ['serviceName'],
    category: 'ambiguous_service',
    domain: 'booking',
    evalKind: 'ambiguous_service',
  },
  {
    id: 'vague-book-no-details',
    prompt: 'book something for someone',
    action: 'create_booking',
    classifiedParams: {},
    clarifyFields: ['employeeName', 'serviceName', 'date', 'timeSlot'],
    category: 'vague_scope',
    domain: 'booking',
    compoundExpectEmpty: true,
  },
  {
    id: 'vague-cancel-unspecified',
    prompt: 'cancel the appointment',
    action: 'cancel_bookings',
    classifiedParams: {},
    clarifyFields: ['date'],
    category: 'vague_scope',
    domain: 'booking',
    compoundExpectEmpty: true,
  },
  {
    id: 'vague-reschedule-missing-target',
    prompt: 'reschedule the appointment to tomorrow at 15:00',
    action: 'reschedule_booking',
    classifiedParams: { date: '2026-06-08', timeSlot: '15:00' },
    clarifyFields: ['bookingId'],
    category: 'vague_scope',
    domain: 'schedule',
    compoundExpectEmpty: true,
  },
  {
    id: 'vague-book-hy',
    prompt: 'ամրագրիր ինչ-որ բան',
    action: 'create_booking',
    classifiedParams: {},
    clarifyFields: ['employeeName', 'serviceName', 'date', 'timeSlot'],
    category: 'vague_scope',
    domain: 'booking',
    locale: 'hy',
    compoundExpectEmpty: true,
  },
  {
    id: 'vague-cancel-ru',
    prompt: 'отмени запись',
    action: 'cancel_bookings',
    classifiedParams: {},
    clarifyFields: ['date'],
    category: 'vague_scope',
    domain: 'booking',
    locale: 'ru',
    compoundExpectEmpty: true,
  },
  {
    id: 'vague-multi-service-missing-names',
    prompt: 'book multi service visit tomorrow at 11:00 with Gevorg',
    action: 'create_multi_service_booking',
    classifiedParams: {
      employeeName: 'Gevorg Gasparyan',
      date: '2026-06-08',
      timeSlot: '11:00',
    },
    clarifyFields: ['serviceNames'],
    category: 'vague_scope',
    domain: 'booking',
  },
  {
    id: 'vague-package-missing-package',
    prompt: 'book package for Anna tomorrow at 09:00',
    action: 'create_package_booking',
    classifiedParams: {
      customerName: 'Anna Kim',
      date: '2026-06-08',
      timeSlot: '09:00',
    },
    clarifyFields: ['packageName'],
    category: 'vague_scope',
    domain: 'catalog',
  },
];

export function countEmployeeNameMatches(
  employees: ReadonlyArray<{ id: string; name: string }>,
  name: string,
): number {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return 0;
  return employees.filter((employee) => {
    const lower = employee.name.toLowerCase();
    if (lower === normalized) return true;
    if (lower.includes(normalized) || normalized.includes(lower)) return true;
    return lower
      .split(/\s+/)
      .some(
        (part) =>
          part === normalized ||
          part.startsWith(normalized) ||
          normalized.startsWith(part),
      );
  }).length;
}

export function inferAmbiguityEvalKind(
  seed: Pick<AmbiguityCorpusSeed, 'evalKind' | 'category' | 'action'>,
): AmbiguityEvalKind {
  if (seed.evalKind) return seed.evalKind;
  if (seed.category === 'ambiguous_provider') return 'ambiguous_provider';
  if (seed.category === 'ambiguous_service') return 'ambiguous_service';
  return 'validation';
}

export function buildAmbiguityResolvedCommand(
  seed: Pick<AmbiguityCorpusSeed, 'action' | 'classifiedParams'>,
): ResolvedCommand {
  const params = { ...(seed.classifiedParams ?? {}) };
  const employees = resolveEmployees(AMBIGUITY_EVAL_EMPLOYEES as any, {
    employeeName: params.employeeName as string | undefined,
    employeeNames: params.employeeNames as string[] | undefined,
    allProviders: params.allProviders as boolean | undefined,
  });
  const services = resolveServices(AMBIGUITY_EVAL_SERVICES as any, {
    serviceName: params.serviceName as string | undefined,
    serviceNames: params.serviceNames as string[] | undefined,
  });
  const employee = employees.length === 1 ? employees[0] : undefined;
  const enrichedParams: Record<string, unknown> = {
    ...params,
    _availableEmployees: AMBIGUITY_EVAL_EMPLOYEES.map((entry) => entry.name).join(', '),
    _availableServices: AMBIGUITY_EVAL_SERVICES.map((entry) => entry.name).join(', '),
  };

  if (employee) {
    enrichedParams.employeeId = employee.id;
    enrichedParams.employeeName = employee.name;
  } else if (employees.length > 1) {
    enrichedParams.employeeIds = employees.map((entry) => entry.id);
    enrichedParams.employeeNames = employees.map((entry) => entry.name);
  }

  if (services.length === 1) {
    enrichedParams.serviceId = services[0].id;
    enrichedParams.serviceName = services[0].name;
  } else if (services.length > 1) {
    enrichedParams.serviceIds = services.map((entry) => entry.id);
    enrichedParams.serviceNames = services.map((entry) => entry.name);
  }

  return {
    action: seed.action,
    prompt: '',
    businessId: 'ambiguity-eval',
    params,
    enrichedParams,
    entities: {
      employee,
      employees,
      service: services.length === 1 ? services[0] : services[0],
      services,
      customer: undefined,
      template: undefined,
      dateRange: null,
      employeeId: employee?.id ?? employees[0]?.id,
    },
    reasoning: 'ambiguity-eval',
    confidence: 0.9,
  } as ResolvedCommand;
}

export function deriveAmbiguityClarifyFields(
  seed: Pick<
    AmbiguityCorpusSeed,
    'action' | 'classifiedParams' | 'evalKind' | 'category'
  >,
): string[] {
  const params = seed.classifiedParams ?? {};
  const evalKind = inferAmbiguityEvalKind(seed);

  if (evalKind === 'ambiguous_provider') {
    const employeeName = params.employeeName as string | undefined;
    if (employeeName && countEmployeeNameMatches(AMBIGUITY_EVAL_EMPLOYEES, employeeName) > 1) {
      return ['employeeName'];
    }
    return [];
  }

  if (evalKind === 'ambiguous_service') {
    const serviceQuery =
      (params.serviceName as string | undefined) ??
      (params.serviceNames as string[] | undefined)?.join(' ');
    if (serviceQuery && matchServicesByQuery(AMBIGUITY_EVAL_SERVICES as any, serviceQuery).length > 1) {
      return ['serviceName'];
    }
    return [];
  }

  const validation = validateCommand(buildAmbiguityResolvedCommand(seed));
  return validation.issues.map((issue) => issue.field);
}

export function ambiguityClarifyFieldsMatch(
  actual: string[],
  expected: string[],
): string[] {
  const errors: string[] = [];
  for (const field of expected) {
    if (!actual.includes(field)) {
      errors.push(
        `clarifyFields: missing expected field "${field}" in [${actual.join(', ')}]`,
      );
    }
  }
  return errors;
}

export function buildAmbiguityCorpusEvalCase(
  seed: AmbiguityCorpusSeed,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    clarifyAction: seed.action,
    clarifyFields: seed.clarifyFields,
    classifiedParams: seed.classifiedParams ?? {},
    ambiguityEvalKind: inferAmbiguityEvalKind(seed),
    ambiguityCategory: seed.category,
    ...(seed.compoundExpectEmpty ? { compoundExpectEmpty: true } : {}),
    ...(seed.compoundExpectEmpty && seed.surface
      ? { compoundSurface: seed.surface }
      : {}),
  };

  return {
    id: `amb-${seed.id}`,
    prompt: seed.prompt,
    locale: seed.locale ?? 'en',
    surface: seed.surface,
    corpus: 'ambiguity',
    difficulty: 'ambiguity',
    domain: seed.domain,
    expect,
  };
}

export function buildAmbiguityCorpusEvalCases(
  seeds: AmbiguityCorpusSeed[] = AMBIGUITY_CORPUS_SEEDS,
): AiCommandEvalCase[] {
  return seeds.map(buildAmbiguityCorpusEvalCase);
}

export function buildAmbiguityCorpusReport(cases: AiCommandEvalCase[]): {
  total: number;
  byCategory: Record<AmbiguityCorpusCategory, number>;
  passedGate: boolean;
} {
  const byCategory = Object.fromEntries(
    ACC_EVAL_AMBIGUITY_CATEGORIES.map((category) => [category, 0]),
  ) as Record<AmbiguityCorpusCategory, number>;

  for (const evalCase of cases) {
    const category = evalCase.expect.ambiguityCategory;
    if (category && category in byCategory) {
      byCategory[category] += 1;
    }
  }

  return {
    total: cases.length,
    byCategory,
    passedGate: cases.length >= ACC_EVAL_MIN_AMBIGUITY_CASES,
  };
}
