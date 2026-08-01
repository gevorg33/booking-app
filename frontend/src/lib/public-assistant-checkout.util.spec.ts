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

describe('shouldAutoNavigateAssistantCheckout (e2e-bug.225)', () => {
  const checkoutNav = {
    path: 'checkout' as const,
    query: {
      serviceId: 'svc-1',
      employeeId: 'emp-1',
      startTime: '2026-06-13T09:00:00.000Z',
    },
  };

  it.each([
    {
      id: 'please-book',
      prompt: 'please book nearest slot',
      navigate: checkoutNav,
      success: true,
      expected: true,
    },
    {
      id: 'book',
      prompt: 'Book Swedish massage tomorrow at 11',
      navigate: checkoutNav,
      success: true,
      expected: true,
    },
    {
      id: 'reserve',
      prompt: 'Reserve me the earliest haircut',
      navigate: checkoutNav,
      success: true,
      expected: true,
    },
    {
      id: 'schedule',
      prompt: 'Schedule a facial for Friday',
      navigate: checkoutNav,
      success: true,
      expected: true,
    },
    {
      id: 'no-booking-verb',
      prompt: 'what is the most premium massage?',
      navigate: checkoutNav,
      success: true,
      expected: false,
    },
    {
      id: 'availability-only',
      prompt: 'Is Gevorg available for Swedish massage?',
      navigate: checkoutNav,
      success: true,
      expected: false,
    },
    {
      id: 'failed-success',
      prompt: 'please book nearest slot',
      navigate: checkoutNav,
      success: false,
      expected: false,
    },
    {
      id: 'no-navigate',
      prompt: 'please book nearest slot',
      navigate: null,
      success: true,
      expected: false,
    },
    {
      id: 'wrong-path-packages',
      prompt: 'please book a package',
      navigate: { path: 'packages', query: {} },
      success: true,
      expected: false,
    },
    {
      id: 'multi-checkout-not-auto',
      prompt: 'please book Swedish and Neck',
      navigate: {
        path: 'multi/checkout',
        query: { services: 'a,b' },
      },
      success: true,
      expected: false,
    },
    {
      id: 'success-undefined',
      prompt: 'please book',
      navigate: checkoutNav,
      success: undefined,
      expected: false,
    },
  ])('$id → $expected', ({ prompt, navigate, success, expected }) => {
    expect(
      shouldAutoNavigateAssistantCheckout(prompt, navigate, success),
    ).toBe(expected);
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
