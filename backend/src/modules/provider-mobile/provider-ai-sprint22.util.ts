import type { EntityMemory } from '../ai/ai-settings.types.js';
import { applyEntityMemoryToParams } from '../ai/ai-entity-memory.util.js';
import {
  buildCoordinationPreviewSummary,
  rescueCoordinationIntent,
} from '../ai/ai-coordination.util.js';
import {
  buildIntelligenceClassifierAppendix,
  extractIntelligenceBlocks,
  stripIntelligenceKeysFromSessionContext,
} from '../ai/ai-intelligence-context.util.js';

export { rescueCoordinationIntent };

export function applyProviderEntityMemory(
  params: Record<string, unknown>,
  prompt: string,
  context?: Record<string, unknown>,
): Record<string, unknown> {
  const aliases = context?._entityMemoryAliases as EntityMemory['aliases'] | undefined;
  if (!aliases || Object.keys(aliases).length === 0) return params;
  return applyEntityMemoryToParams(params, { aliases }, prompt);
}

export function buildProviderClassifierAppendix(context?: Record<string, unknown>): string {
  return buildIntelligenceClassifierAppendix(extractIntelligenceBlocks(context));
}

export function buildProviderSessionContextBlock(context?: Record<string, unknown>): string {
  const session = stripIntelligenceKeysFromSessionContext(context);
  if (!session || !Object.values(session).some((value) => value != null && value !== '')) {
    return '';
  }
  return `\nActive session context:\n${JSON.stringify(session, null, 2)}`;
}

export function formatProviderHistoryBlock(
  history?: Array<{ role: 'user' | 'assistant'; content: string }>,
): string {
  const historyText = (history ?? [])
    .slice(-8)
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n');
  return historyText ? `\nRecent conversation:\n${historyText}` : '';
}

export function matchWaitlistCustomerByName<T extends { name: string }>(
  customers: T[],
  name: string | null | undefined,
): T | null {
  if (!name?.trim()) return null;
  const lower = name.toLowerCase().trim();
  return (
    customers.find((customer) => customer.name.toLowerCase() === lower) ??
    customers.find((customer) => customer.name.toLowerCase().includes(lower)) ??
    null
  );
}

export function matchEmployeeByName<T extends { name: string }>(
  employees: T[],
  name: string | null | undefined,
): T | null {
  if (!name?.trim()) return null;
  const lower = name.toLowerCase().trim();
  return (
    employees.find((employee) => employee.name.toLowerCase() === lower) ??
    employees.find((employee) => employee.name.toLowerCase().includes(lower)) ??
    null
  );
}

export function buildCoordinateWaitlistConfirmation(input: {
  employeeName: string;
  waitlistCustomerName: string;
  bookings: Array<{ id: string; label: string }>;
  params: Record<string, unknown>;
}) {
  const bookingLabel = input.bookings[0]?.label ?? 'the appointment';
  const summary = buildCoordinationPreviewSummary({
    employeeName: input.employeeName,
    waitlistCustomerName: input.waitlistCustomerName,
    bookingLabel,
    bookingCount: input.bookings.length,
  });

  return {
    success: true,
    action: 'coordinate_waitlist_offer',
    summary,
    details: {
      requiresConfirmation: true,
      bookingIds: input.bookings.map((booking) => booking.id),
      preview: input.bookings.map((booking) => booking.label),
      pendingAction: {
        action: 'coordinate_waitlist_offer',
        params: {
          ...input.params,
          waitlistCustomerName: input.waitlistCustomerName,
        },
      },
      coordination: {
        employeeName: input.employeeName,
        waitlistCustomerName: input.waitlistCustomerName,
      },
    },
  };
}
