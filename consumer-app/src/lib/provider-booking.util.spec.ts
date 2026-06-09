import { describe, expect, it } from 'vitest';
import {
  buildAnyAvailabilityPath,
  buildAutoAssignBookPath,
  buildProfessionalsFirstBookPath,
  buildProfessionalsPath,
  buildProfessionalServicesPath,
  buildProviderProfilePath,
  groupServicesByCategory,
} from './provider-booking.util.js';

describe('provider-booking.util', () => {
  it('builds professionals-first routes', () => {
    expect(buildProfessionalsPath('salon')).toBe('/s/salon/professionals');
    expect(
      buildProfessionalsPath('salon', {
        employeeId: 'emp-1',
        startTime: '2026-06-09T10:00:00.000Z',
      }),
    ).toBe('/s/salon/professionals?employeeId=emp-1&startTime=2026-06-09T10%3A00%3A00.000Z');
    expect(
      buildProfessionalServicesPath('salon', 'emp-1', '2026-06-09T10:00:00.000Z', {
        employeeName: 'Alex',
      }),
    ).toContain('/s/salon/professionals/services?');
    expect(buildProviderProfilePath('salon', 'emp-2')).toBe('/s/salon/providers/emp-2');
    expect(buildProfessionalsFirstBookPath('salon', 'svc-1', 'emp-1', '2026-06-09T14:00:00.000Z')).toBe(
      '/s/salon/book/svc-1?employeeId=emp-1&slot=2026-06-09T14%3A00%3A00.000Z&date=2026-06-09&professionalsFirst=1',
    );
    expect(buildAnyAvailabilityPath('salon', 'svc-1')).toBe(
      '/s/salon/book/any/availability?serviceId=svc-1',
    );
    expect(buildAutoAssignBookPath('salon', 'svc-1', '2026-06-09T14:00:00.000Z')).toBe(
      '/s/salon/book/svc-1?slot=2026-06-09T14%3A00%3A00.000Z&date=2026-06-09&autoAssign=1',
    );
  });

  it('groups services by category', () => {
    const groups = groupServicesByCategory(
      [
        {
          id: 'b',
          name: 'B',
          durationMinutes: 30,
          price: 20,
          category: { id: 'cat-2', name: 'Nails', sortOrder: 2 },
        },
        {
          id: 'a',
          name: 'A',
          durationMinutes: 30,
          price: 10,
          category: { id: 'cat-1', name: 'Hair', sortOrder: 1 },
        },
      ],
      'Other',
    );
    expect(groups.map((group) => group.categoryName)).toEqual(['Hair', 'Nails']);
  });
});
