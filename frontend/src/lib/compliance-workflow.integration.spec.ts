import { describe, expect, it } from 'vitest';
import {
  canSubmitBreachReport,
  isBusinessOwner,
  resolveBreachDeadlineAlerts,
} from './compliance-workflow';

describe('Sprint 37 — compliance workflow scenario matrix', () => {
  it.each([
    { role: 'owner', canViewOwnerPanels: true },
    { role: 'admin', canViewOwnerPanels: false },
    { role: 'manager', canViewOwnerPanels: false },
    { role: 'staff', canViewOwnerPanels: false },
    { role: undefined, canViewOwnerPanels: false },
  ])('owner panel access for role=$role', ({ role, canViewOwnerPanels }) => {
    expect(isBusinessOwner(role)).toBe(canViewOwnerPanels);
  });

  it.each([
    { description: '', submit: false },
    { description: '123456789', submit: false },
    { description: '1234567890', submit: true },
    { description: '  valid breach description  ', submit: true },
  ])(
    'breach form submit for description length=${description.length}',
    ({ description, submit }) => {
      expect(canSubmitBreachReport(description)).toBe(submit);
    },
  );

  it.each([
    {
      deadline: '2026-06-04T10:00:00.000Z',
      now: '2026-06-04T08:00:00.000Z',
      approaching: true,
      overdue: false,
    },
    {
      deadline: '2026-06-03T10:00:00.000Z',
      now: '2026-06-04T08:00:00.000Z',
      approaching: false,
      overdue: true,
    },
    {
      deadline: '2026-06-06T10:00:00.000Z',
      now: '2026-06-04T08:00:00.000Z',
      approaching: false,
      overdue: false,
    },
  ])(
    'breach deadline flags approaching=$approaching overdue=$overdue',
    ({ deadline, now, approaching, overdue }) => {
      expect(resolveBreachDeadlineAlerts(deadline, new Date(now).getTime())).toEqual({
        approaching,
        overdue,
      });
    },
  );

  it('combines deadline flags for incident list rendering', () => {
    const now = new Date('2026-06-04T08:00:00.000Z').getTime();
    const incident = {
      gdprNotificationDeadlineAt: '2026-06-04T10:00:00.000Z',
      ...resolveBreachDeadlineAlerts('2026-06-04T10:00:00.000Z', now),
    };
    expect(incident.approaching).toBe(true);
    expect(incident.overdue).toBe(false);
  });
});
