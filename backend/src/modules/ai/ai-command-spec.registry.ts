/**
 * AI-ROADMAP Phase 1 — the spec index.
 *
 * As each domain is ported it is appended here. This is the list the planner,
 * validator and tool-definition builder read from — so a ported domain becomes
 * live everywhere at once rather than needing to be registered in six places
 * (the failure mode that produced e2e-bug.342).
 */
import { APPOINTMENT_COMMAND_SPECS } from './ai-command-spec.appointment.js';
import { BOOKING_COMMAND_SPECS } from './ai-command-spec.booking.js';
import { CATALOG_COMMAND_SPECS } from './ai-command-spec.catalog.js';
import { CLINIC_COMMAND_SPECS } from './ai-command-spec.clinic.js';
import { CORE_COMMAND_SPECS } from './ai-command-spec.core.js';
import { COMMERCE_COMMAND_SPECS } from './ai-command-spec.commerce.js';
import { CUSTOMER_COMMAND_SPECS } from './ai-command-spec.customer.js';
import { LONG_TAIL_COMMAND_SPECS } from './ai-command-spec.long-tail.js';
import { PAYMENT_COMMAND_SPECS } from './ai-command-spec.payment.js';
import { PROVIDER_COMMAND_SPECS } from './ai-command-spec.provider.js';
import { REMAINING_COMMAND_SPECS } from './ai-command-spec.remaining.js';
import { SCHEDULE_COMMAND_SPECS } from './ai-command-spec.schedule.js';
import type { CommandSpec } from './ai-command-spec.types.js';

export const COMMAND_SPECS: readonly CommandSpec[] = [
  ...APPOINTMENT_COMMAND_SPECS,
  ...CATALOG_COMMAND_SPECS,
  ...PAYMENT_COMMAND_SPECS,
  ...CUSTOMER_COMMAND_SPECS,
  ...SCHEDULE_COMMAND_SPECS,
  ...LONG_TAIL_COMMAND_SPECS,
  ...BOOKING_COMMAND_SPECS,
  ...CLINIC_COMMAND_SPECS,
  ...PROVIDER_COMMAND_SPECS,
  ...COMMERCE_COMMAND_SPECS,
  ...REMAINING_COMMAND_SPECS,
  ...CORE_COMMAND_SPECS,
];

export const COMMAND_SPECS_BY_ID: ReadonlyMap<string, CommandSpec> = new Map(
  COMMAND_SPECS.map((s) => [s.id, s]),
);

/** Canonical id for a legacy flat action name, when that action has been ported. */
export const COMMAND_SPEC_ID_BY_ALIAS: ReadonlyMap<string, string> = new Map(
  COMMAND_SPECS.flatMap((s) => s.aliases.map((a) => [a, s.id] as const)),
);
