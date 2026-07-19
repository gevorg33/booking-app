import type { PublicCustomerWaitlistRequest } from '../services/public-api.js';

export function formatWaitlistPreferenceSummary(
  request: PublicCustomerWaitlistRequest | null | undefined,
): string | null {
  if (!request || request.status !== 'active') return null;
  const parts: string[] = [];
  if (request.serviceName?.trim()) parts.push(request.serviceName.trim());
  if (request.employeeName?.trim()) parts.push(request.employeeName.trim());
  if (request.date?.trim()) parts.push(request.date.trim());
  else if (request.dateFrom?.trim() || request.dateTo?.trim()) {
    const from = request.dateFrom?.trim() ?? '';
    const to = request.dateTo?.trim() ?? '';
    parts.push([from, to].filter(Boolean).join(' – '));
  }
  if (request.timeOfDay?.trim()) parts.push(request.timeOfDay.trim());
  else if (request.timeSlot?.trim()) parts.push(request.timeSlot.trim());
  return parts.length ? parts.join(' · ') : null;
}
