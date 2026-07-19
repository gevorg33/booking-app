import {
  buildOpeningHoursSummaryLines,
  buildPublicOpeningHoursFromTemplates,
} from './public-opening-hours.util.js';

describe('public-opening-hours.util (e2e-bug.50)', () => {
  it('returns undefined when templates are empty', () => {
    expect(buildPublicOpeningHoursFromTemplates([])).toBeUndefined();
    expect(buildPublicOpeningHoursFromTemplates(undefined)).toBeUndefined();
  });

  it('derives weekly hours from SERVICE_BLOCK periods (salon playbook shape)', () => {
    const hours = buildPublicOpeningHoursFromTemplates([
      {
        isActive: true,
        periods: [
          {
            type: 'service_block',
            startTime: '09:00',
            endTime: '19:00',
            isActiveOnMonday: true,
            isActiveOnTuesday: true,
            isActiveOnWednesday: true,
            isActiveOnThursday: true,
            isActiveOnFriday: true,
          },
          {
            type: 'service_block',
            startTime: '10:00',
            endTime: '17:00',
            isActiveOnSaturday: true,
          },
        ],
      },
    ]);

    expect(hours?.summaryLines).toEqual([
      'Mon–Fri 09:00–19:00',
      'Sat 10:00–17:00',
      'Sun Closed',
    ]);
    expect(hours?.days.find((d) => d.day === 'monday')).toEqual({
      day: 'monday',
      closed: false,
      ranges: [{ open: '09:00', close: '19:00' }],
    });
    expect(hours?.days.find((d) => d.day === 'sunday')?.closed).toBe(true);
  });

  it('ignores unavailable/blocked periods and inactive/deleted templates', () => {
    const hours = buildPublicOpeningHoursFromTemplates([
      {
        isDeleted: true,
        periods: [
          {
            type: 'service_block',
            startTime: '08:00',
            endTime: '12:00',
            isActiveOnMonday: true,
          },
        ],
      },
      {
        isActive: false,
        periods: [
          {
            type: 'service_block',
            startTime: '08:00',
            endTime: '12:00',
            isActiveOnTuesday: true,
          },
        ],
      },
      {
        isActive: true,
        periods: [
          {
            type: 'unavailable_block',
            startTime: '12:00',
            endTime: '13:00',
            isActiveOnWednesday: true,
          },
          {
            type: 'service_block',
            startTime: '09:00',
            endTime: '17:00',
            isActiveOnWednesday: true,
          },
        ],
      },
    ]);

    expect(hours?.summaryLines).toEqual([
      'Mon–Tue Closed',
      'Wed 09:00–17:00',
      'Thu–Sun Closed',
    ]);
  });

  it('falls back to legacy dayOfWeek + workingHours when periods missing', () => {
    const hours = buildPublicOpeningHoursFromTemplates([
      {
        isActive: true,
        dayOfWeek: 0,
        workingHours: [{ startTime: '9:00', endTime: '13:00' }],
      },
      {
        isActive: true,
        dayOfWeek: 0,
        workingHours: [{ startTime: '14:00', endTime: '18:00' }],
      },
    ]);

    expect(hours?.days[0]).toEqual({
      day: 'monday',
      closed: false,
      ranges: [
        { open: '09:00', close: '13:00' },
        { open: '14:00', close: '18:00' },
      ],
    });
    expect(hours?.summaryLines[0]).toBe('Mon 09:00–13:00, 14:00–18:00');
  });

  it('buildOpeningHoursSummaryLines collapses consecutive identical days', () => {
    expect(
      buildOpeningHoursSummaryLines([
        { day: 'monday', closed: false, ranges: [{ open: '09:00', close: '17:00' }] },
        { day: 'tuesday', closed: false, ranges: [{ open: '09:00', close: '17:00' }] },
        { day: 'wednesday', closed: true, ranges: [] },
      ]),
    ).toEqual(['Mon–Tue 09:00–17:00', 'Wed Closed']);
  });
});
