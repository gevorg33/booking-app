import { describe, expect, it } from 'vitest';
import {
  buildPublicAssistantCheckoutNavigate,
  resolveAssistantSlotStartTime,
  shouldAutoNavigateAssistantCheckout,
} from './public-assistant-checkout.util';

describe('resolveAssistantSlotStartTime', () => {
  it('matches provider and wall-clock time to ISO startTime', () => {
    expect(
      resolveAssistantSlotStartTime(
        [
          {
            startTime: '2026-06-09T09:30:00.000Z',
            employeeId: 'emp-1',
            employeeName: 'Mary Torgomyan',
          },
        ],
        { id: 'emp-1', name: 'Mary Torgomyan' },
        '09:30',
      ),
    ).toBe('2026-06-09T09:30:00.000Z');
  });
});

describe('shouldAutoNavigateAssistantCheckout', () => {
  it('auto-navigates on please book with checkout navigate', () => {
    expect(
      shouldAutoNavigateAssistantCheckout(
        'please book nearest slot',
        {
          path: 'checkout',
          query: {
            serviceId: 'svc-1',
            employeeId: 'emp-1',
            startTime: '2026-06-13T09:00:00.000Z',
          },
        },
        true,
      ),
    ).toBe(true);
  });

  it('does not auto-navigate without booking phrasing', () => {
    expect(
      shouldAutoNavigateAssistantCheckout(
        'what is the most premium massage?',
        { path: 'checkout', query: { serviceId: 'svc-1' } },
        true,
      ),
    ).toBe(false);
  });
});

describe('buildPublicAssistantCheckoutNavigate', () => {
  it('builds multi-service checkout navigation', () => {
    expect(
      buildPublicAssistantCheckoutNavigate(
        {
          serviceIds: ['svc-brows', 'svc-lips'],
          slots: [
            {
              startTime: '2026-06-09T09:00:00.000Z',
              employeeId: 'emp-1',
              employeeName: 'Mary Torgomyan',
            },
          ],
        },
        { id: 'emp-1', name: 'Mary Torgomyan', previewTimes: ['09:00'] },
        '09:00',
      ),
    ).toEqual({
      path: 'multi/checkout',
      query: {
        services: 'svc-brows,svc-lips',
        startTime: '2026-06-09T09:00:00.000Z',
        employeeId: 'emp-1',
        employeeName: 'Mary Torgomyan',
      },
    });
  });

  it('builds single-service checkout navigation', () => {
    expect(
      buildPublicAssistantCheckoutNavigate(
        {
          serviceId: 'svc-1',
          slots: [
            {
              startTime: '2026-06-09T14:00:00.000Z',
              employeeId: 'emp-2',
              employeeName: 'Gevorg Gasparyan',
            },
          ],
        },
        { id: 'emp-2', name: 'Gevorg Gasparyan', previewTimes: ['14:00'] },
        '14:00',
      ),
    ).toEqual({
      path: 'checkout',
      query: {
        serviceId: 'svc-1',
        startTime: '2026-06-09T14:00:00.000Z',
        employeeId: 'emp-2',
      },
    });
  });
});
