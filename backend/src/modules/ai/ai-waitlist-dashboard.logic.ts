import type { Repository } from 'typeorm';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { CommandResult } from './command-completion.types.js';

export interface WaitlistDashboardLogicDeps {
  customerRepo: Repository<Customer>;
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function failure(action: string, summary: string): CommandResult {
  return { success: false, action, summary, details: {} };
}

export async function handleListWaitlistEntriesLogic(
  deps: WaitlistDashboardLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const limit = typeof params.limit === 'number' ? params.limit : 20;

  const waitlist = await deps.customerRepo
    .createQueryBuilder('c')
    .where('c.business_id = :businessId', { businessId })
    .andWhere(`'waitlist' = ANY(c.tags)`)
    .orderBy('c.name', 'ASC')
    .getMany();

  if (waitlist.length === 0) {
    return success(
      'list_waitlist_entries',
      'No waitlist entries — tag customers with "waitlist" in CRM.',
      { count: 0, entries: [] },
    );
  }

  const shown = waitlist.slice(0, limit);
  const lines = shown.map((c) => {
    const contact = [c.phone, c.email].filter(Boolean).join(' · ');
    return `• ${c.name}${contact ? ` (${contact})` : ''}`;
  });
  if (waitlist.length > limit) {
    lines.push(`… and ${waitlist.length - limit} more`);
  }

  return success(
    'list_waitlist_entries',
    `Waitlist entries (${waitlist.length}):\n${lines.join('\n')}`,
    {
      count: waitlist.length,
      entries: shown.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
      })),
    },
  );
}

export async function handleOfferWaitlistSlotLogic(
  deps: WaitlistDashboardLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const employeeName =
    typeof params.employeeName === 'string'
      ? params.employeeName.trim()
      : undefined;
  const date = typeof params.date === 'string' ? params.date : undefined;
  const timeSlot =
    typeof params.timeSlot === 'string' ? params.timeSlot : undefined;

  if (!employeeName || !date || !timeSlot) {
    return failure(
      'offer_waitlist_slot',
      'Specify employeeName, date, and timeSlot for the open slot to offer waitlisted customers.',
    );
  }

  const waitlist = await deps.customerRepo
    .createQueryBuilder('c')
    .where('c.business_id = :businessId', { businessId })
    .andWhere(`'waitlist' = ANY(c.tags)`)
    .orderBy('c.name', 'ASC')
    .getMany();

  if (waitlist.length === 0) {
    return failure(
      'offer_waitlist_slot',
      'No customers on the waitlist — add the waitlist tag in CRM first.',
    );
  }

  const displayDay = date;
  const recipients = waitlist.slice(0, 5).map((c) => c.name);
  const summary = [
    `Prepared waitlist offer for ${employeeName} on ${displayDay} at ${timeSlot}.`,
    `Notify: ${recipients.join(', ')}${waitlist.length > 5 ? ` (+${waitlist.length - 5} more)` : ''}.`,
    'Send messages from the waitlist panel or use fill_slot_from_waitlist to book directly.',
  ].join('\n');

  return success('offer_waitlist_slot', summary, {
    employeeName,
    date,
    timeSlot,
    waitlistCount: waitlist.length,
    proposedRecipients: recipients,
  });
}
