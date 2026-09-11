/**
 * AI-ROADMAP Phase 3 — golden plans.
 *
 * These are the contract for multi-command extraction: given a message, the
 * planner must produce this plan. They are written against the 16 specced
 * commands (appointment + catalog pilots).
 */
import type { AccessTier } from './access-control.matrix.js';
import type { CommandPlan } from './ai-command-plan.types.js';

export type PlanFixture = {
  id: string;
  message: string;
  surface: 'dashboard' | 'provider' | 'customer' | 'public';
  /**
   * The actor asking. A plan is only valid for a *someone* — the same message
   * from a `staff` member and an `owner` are different requests, because the
   * shortlist the planner is shown differs.
   */
  tier: AccessTier;
  plan: CommandPlan;
  /** What validation must conclude. */
  expectExecutable: boolean;
  notes?: string;
};

export const PLAN_FIXTURES: readonly PlanFixture[] = [
  {
    id: 'headline-three-commands-one-unsupported',
    message:
      "Move John's appointment to tomorrow at 3 PM, cancel Mary's appointment, and create a new patient named David for Friday.",
    surface: 'dashboard',
    tier: 'owner',
    plan: {
      steps: [
        {
          id: 's1',
          command: 'appointment.reschedule',
          variables: {
            customerName: 'John',
            date: '2026-08-04',
            timeSlot: '15:00',
          },
          confidence: 0.94,
          dependsOn: [],
        },
        {
          id: 's2',
          command: 'appointment.cancel_bulk',
          variables: { customerName: 'Mary' },
          confidence: 0.91,
          dependsOn: [],
        },
        {
          // The platform has NO create-customer command — only update_customer,
          // lookup_customer, merge_customers. Customers are created implicitly
          // during booking. The planner must say so rather than steal this to
          // `update_customer` (which would mutate an existing person) or to
          // `appointment.create`.
          id: 's3',
          command: 'patient.create',
          variables: { name: 'David' },
          confidence: 0.72,
          dependsOn: [],
        },
      ],
      unresolved: [],
      topicChanged: false,
    },
    expectExecutable: false,
    notes:
      "The user's own headline example contains an unsupported capability. Correct behaviour is to clarify, execute nothing, and NOT approximate it with a neighbouring command.",
  },
  {
    id: 'multi-command-all-supported',
    message:
      "Move John's appointment to tomorrow at 3 PM, cancel Mary's appointment, and add a service category called Wellness.",
    surface: 'dashboard',
    tier: 'owner',
    plan: {
      steps: [
        {
          id: 's1',
          command: 'appointment.reschedule',
          variables: {
            customerName: 'John',
            date: '2026-08-04',
            timeSlot: '15:00',
          },
          confidence: 0.94,
          dependsOn: [],
        },
        {
          id: 's2',
          command: 'appointment.cancel_bulk',
          variables: { customerName: 'Mary' },
          confidence: 0.91,
          dependsOn: [],
        },
        {
          id: 's3',
          command: 'catalog.create_category',
          variables: { categoryName: 'Wellness' },
          confidence: 0.9,
          dependsOn: [],
        },
      ],
      unresolved: [],
      topicChanged: false,
    },
    expectExecutable: true,
    notes:
      'Three independent commands across two domains from one message — the capability `compound_intent` fails 61.8% of the time in production.',
  },
  {
    id: 'dependent-steps-with-output-reference',
    message:
      'Create a category called Recovery, then move deep tissue massage and hot stone massage into it.',
    surface: 'dashboard',
    tier: 'owner',
    plan: {
      steps: [
        {
          id: 's1',
          command: 'catalog.create_category',
          variables: { categoryName: 'Recovery' },
          confidence: 0.93,
          dependsOn: [],
        },
        {
          id: 's2',
          command: 'catalog.assign_services_category_bulk',
          variables: {
            serviceNames: ['Deep tissue massage', 'Hot stone massage'],
            // Consumes step 1's output — this is what makes "create X and then
            // use X" work as a single message.
            categoryName: '$s1.categoryName',
          },
          confidence: 0.88,
          dependsOn: ['s1'],
        },
      ],
      unresolved: [],
      topicChanged: false,
    },
    expectExecutable: true,
  },
  {
    id: 'surface-violation-customer-command-on-dashboard',
    message: 'cancel my appointment',
    surface: 'dashboard',
    tier: 'owner',
    plan: {
      steps: [
        {
          id: 's1',
          command: 'appointment.cancel_mine',
          variables: {},
          confidence: 0.95,
          dependsOn: [],
        },
      ],
      unresolved: [],
      topicChanged: false,
    },
    expectExecutable: false,
    notes:
      'e2e-bug.349 in miniature: a customer-only command reaching a dashboard request. Rejected, never remapped to a dashboard cancel.',
  },
  {
    id: 'missing-required-variable',
    // Was `appointment.reschedule` missing `newStart`. Neither that variable
    // nor `appointmentId` is read by any handler (tech-debt A6 / e2e-bug.399),
    // so the fixture was asserting on a contract that did not exist. Moved to
    // `appointment.create`, whose `date` really is required and really is read.
    message: 'book Sarah a deep tissue massage',
    surface: 'dashboard',
    tier: 'owner',
    plan: {
      steps: [
        {
          id: 's1',
          command: 'appointment.create',
          variables: {
            customerName: 'Sarah',
            serviceName: 'deep tissue massage',
          },
          confidence: 0.9,
          dependsOn: [],
        },
      ],
      unresolved: [],
      topicChanged: false,
    },
    expectExecutable: false,
    notes: 'No day given — must ask for it by name, not fail generically.',
  },
  {
    id: 'unresolved-entity-blocks-execution',
    message: 'cancel the massage appointment',
    surface: 'dashboard',
    tier: 'owner',
    plan: {
      steps: [
        {
          id: 's1',
          command: 'appointment.cancel_bulk',
          variables: { customerName: 'John' },
          confidence: 0.85,
          dependsOn: [],
        },
      ],
      unresolved: ['John — there are two customers called John'],
      topicChanged: false,
    },
    expectExecutable: false,
    notes:
      'Ambiguous entity → clarify, never silently pick one (Regex.MD §8.3 Resolution).',
  },
];
