import { describe, expect, it } from 'vitest';
import { buildProviderAiScreenContext } from './provider-ai-context';
import type { BookingSummary } from './booking-types';

const bookings: BookingSummary[] = [
  {
    id: 'bk-1',
    startTime: '2026-06-09T10:00:00.000Z',
    endTime: '2026-06-09T11:00:00.000Z',
    status: 'confirmed',
    notes: null,
    service: { name: 'Massage' },
    customer: { name: 'Maria Lopez', phone: null, email: null },
    employee: { id: 'emp-1', name: 'Anna Smith' },
  },
];

describe('buildProviderAiScreenContext (n99-2.2)', () => {
  it('returns route-only context when nothing is selected', () => {
    expect(buildProviderAiScreenContext('/tabs/today', {}, bookings, null)).toEqual({
      route: '/tabs/today',
    });
  });

  it('grounds selected booking ids and names for deictic prompts', () => {
    const ctx = buildProviderAiScreenContext('/tabs/today', {}, bookings, 'bk-1');
    expect(ctx.bookingId).toBe('bk-1');
    expect(ctx.customerName).toBe('Maria Lopez');
    expect(ctx.serviceName).toBe('Massage');
    expect(ctx.employeeId).toBe('emp-1');
    expect(ctx.employeeName).toBe('Anna Smith');
    expect(ctx.date).toBeTruthy();
    expect(ctx.timeSlot).toBeTruthy();
  });
});
