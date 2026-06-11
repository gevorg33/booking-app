import type { ProviderOnboardingCompoundStepAction } from './ai-provider-onboarding-compound.util.js';

export type ProviderOnboardingCompoundFixture = {
  id: string;
  prompt: string;
  orderedActions: ProviderOnboardingCompoundStepAction[];
  expectedParams?: Record<string, unknown>;
};

export const PROVIDER_ONBOARDING_COMPOUND_PROMPTS = [
  {
    id: 'onboard-stylist-anna-e2e-en',
    prompt:
      'Onboard new stylist Anna end-to-end: create employee, assign haircut and color services, set up first week from weekday template, enable online booking',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      employeeName: 'Anna',
      serviceNames: ['haircut', 'color'],
      templateName: 'weekday',
      enabled: true,
    },
  },
  {
    id: 'onboard-therapist-maria-scratch-en',
    prompt:
      'Set up new therapist Maria from scratch — add to team, assign massage services, schedule first week from weekday template, turn on public booking',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      employeeName: 'Maria',
      serviceNames: ['massage'],
      templateName: 'weekday',
      enabled: true,
    },
  },
  {
    id: 'onboard-barber-jake-full-en',
    prompt:
      'Full provider setup for barber Jake: hire employee; assign beard trim services; onboard first week with weekday template; enable online booking page',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      employeeName: 'Jake',
      serviceNames: ['beard trim'],
      templateName: 'weekday',
      enabled: true,
    },
  },
  {
    id: 'onboard-provider-sofia-e2e-en',
    prompt:
      'Provider onboarding end-to-end for Sofia — create employee, assign facial services, set up first week schedule from weekday template, enable public booking website',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      employeeName: 'Sofia',
      serviceNames: ['facial'],
      templateName: 'weekday',
      enabled: true,
    },
  },
  {
    id: 'onboard-colorist-emma-en',
    prompt:
      'Onboard new color specialist Emma: add employee and assign color services; then set up her first week from weekday template and enable online booking',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      employeeName: 'Emma',
      serviceNames: ['color'],
      templateName: 'weekday',
      enabled: true,
    },
  },
  {
    id: 'onboard-nail-tech-nina-en',
    prompt:
      'Get new nail tech Nina ready end-to-end — create provider, assign nails services, onboard schedule for first week, turn on booking page',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      employeeName: 'Nina',
      serviceNames: ['nails'],
      enabled: true,
    },
  },
  {
    id: 'onboard-massage-leo-en',
    prompt:
      'Set up new massage therapist Leo from scratch; hire employee; assign deep tissue and sports massage services; schedule first week; enable online booking',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      employeeName: 'Leo',
      serviceNames: ['deep tissue', 'sports massage'],
      enabled: true,
    },
  },
  {
    id: 'onboard-esthetician-olivia-en',
    prompt:
      'Full setup new esthetician Olivia: create employee, assign skincare services, onboard provider schedule first week from weekday template, configure online booking',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      employeeName: 'Olivia',
      serviceNames: ['skincare'],
      templateName: 'weekday',
      enabled: true,
    },
  },
  {
    id: 'onboard-provider-david-en',
    prompt:
      'Onboard provider David end-to-end — add to roster, assign haircut services, set up first week from weekday template, enable public booking',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      employeeName: 'David',
      serviceNames: ['haircut'],
      templateName: 'weekday',
      enabled: true,
    },
  },
  {
    id: 'onboard-team-member-chris-en',
    prompt:
      'New hire team member Chris full setup: create employee; assign barber services; onboard first week schedule; turn on online booking',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      employeeName: 'Chris',
      serviceNames: ['barber'],
      enabled: true,
    },
  },
  {
    id: 'onboard-specialist-maya-en',
    prompt:
      'Onboard new specialist Maya from scratch and then assign waxing services, schedule her first week with weekday template, and enable booking website',
    orderedActions: [
      'create_employee',
      'assign_employee_services',
      'onboard_provider_schedule',
      'configure_online_booking',
    ] as const,
    expectedParams: {
      employeeName: 'Maya',
      serviceNames: ['waxing'],
      templateName: 'weekday',
      enabled: true,
    },
  },
] as const satisfies readonly ProviderOnboardingCompoundFixture[];

export const PROVIDER_ONBOARDING_EN_SCENARIO_IDS =
  PROVIDER_ONBOARDING_COMPOUND_PROMPTS.map((row) => row.id);
