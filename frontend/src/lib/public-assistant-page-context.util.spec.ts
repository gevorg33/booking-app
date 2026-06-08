import { describe, expect, it } from 'vitest';
import { buildPublicAssistantPageContext } from './public-assistant-page-context.util';

describe('buildPublicAssistantPageContext (n99-2.2)', () => {
  it('maps booking flow query params into assistant screen context', () => {
    const params = new URLSearchParams({
      serviceId: 'svc-1',
      serviceName: 'Haircut',
      employeeId: 'emp-2',
      employeeName: 'Sam Rivera',
      date: '2026-06-09',
      startTime: '10:00',
    });

    expect(
      buildPublicAssistantPageContext({
        pathname: '/book/demo/services',
        searchParams: params,
      }),
    ).toEqual({
      route: '/book/demo/services',
      serviceId: 'svc-1',
      serviceName: 'Haircut',
      employeeId: 'emp-2',
      employeeName: 'Sam Rivera',
      date: '2026-06-09',
      startTime: '10:00',
      timeSlot: '10:00',
    });
  });
});
