import {
  buildBusinessHoursLocationSummary,
  handleExplainBusinessHoursAndLocationLogic,
} from './ai-explain-business-hours-and-location.logic.js';
import type { BusinessHoursLocationLogicDeps } from './ai-explain-business-hours-and-location.logic.js';
import { formatBusinessHoursLabel } from './ai-explain-business-hours-and-location.util.js';
import type { PublicOpeningHours } from '../public-booking/public-opening-hours.util.js';

const TEMPLATE_HOURS_18: PublicOpeningHours = {
  days: [
    {
      day: 'monday',
      closed: false,
      ranges: [{ open: '09:00', close: '18:00' }],
    },
    {
      day: 'tuesday',
      closed: false,
      ranges: [{ open: '09:00', close: '18:00' }],
    },
    {
      day: 'wednesday',
      closed: false,
      ranges: [{ open: '09:00', close: '18:00' }],
    },
    {
      day: 'thursday',
      closed: false,
      ranges: [{ open: '09:00', close: '18:00' }],
    },
    {
      day: 'friday',
      closed: false,
      ranges: [{ open: '09:00', close: '18:00' }],
    },
    {
      day: 'saturday',
      closed: false,
      ranges: [{ open: '09:00', close: '18:00' }],
    },
    { day: 'sunday', closed: true, ranges: [] },
  ],
  summaryLines: ['Mon–Sat 09:00–18:00', 'Sun Closed'],
};

function buildDeps(
  overrides: Partial<BusinessHoursLocationLogicDeps> = {},
): BusinessHoursLocationLogicDeps {
  return {
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        name: 'Glow Studio',
        address: '12 Main Street',
        phone: '+1 555 0100',
        email: 'hello@glow.example',
        settings: {
          // Stale settings default that caused e2e-bug.227 when preferred over templates.
          hours: { open: '09:00', close: '19:00' },
          location: {
            mapEmbedHtml:
              '<iframe src="https://www.google.com/maps/embed?pb=abc"></iframe>',
            parkingCopy: 'Free street parking behind the salon.',
          },
        },
      })),
    } as unknown as BusinessHoursLocationLogicDeps['businessRepo'],
    ...overrides,
  };
}

describe('ai-explain-business-hours-and-location.logic (ai-cmd-customer-4.1.5)', () => {
  it('buildBusinessHoursLocationSummary covers hours, location, and parking', () => {
    const business = {
      name: 'Glow Studio',
      address: '12 Main Street',
      settings: {
        hours: { open: '09:00', close: '19:00' },
        location: {
          mapEmbedHtml:
            '<iframe src="https://www.google.com/maps/embed?pb=abc"></iframe>',
          parkingCopy: 'Free street parking behind the salon.',
        },
      },
    } as any;

    expect(
      buildBusinessHoursLocationSummary({
        business,
        aspect: 'hours',
        weekday: 'saturday',
      }),
    ).toContain('Saturday hours');
    expect(
      buildBusinessHoursLocationSummary({
        business,
        aspect: 'location',
      }),
    ).toContain('12 Main Street');
    expect(
      buildBusinessHoursLocationSummary({
        business,
        aspect: 'parking',
      }),
    ).toContain('Free street parking');
  });

  it('explains Saturday hours from prompt', async () => {
    const result = await handleExplainBusinessHoursAndLocationLogic(
      buildDeps(),
      'biz-1',
      {},
      'When are you open Saturday?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_business_hours_and_location');
    expect(result.summary).toContain('Saturday');
    expect((result.details as { mapsUrl?: string }).mapsUrl).toContain(
      'google.com/maps',
    );
    expect(
      (result.details as { navigate?: { path: string } }).navigate?.path,
    ).toBe('profile');
  });

  it('e2e-bug.137 — owner "What are my business hours?" returns opening hours', async () => {
    const result = await handleExplainBusinessHoursAndLocationLogic(
      buildDeps(),
      'biz-1',
      {},
      'What are my business hours?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_business_hours_and_location');
    expect(result.summary).toMatch(/opening hours|09:00|19:00/i);
  });

  it('e2e-bug.227 — prefers schedule-template hours over settings close 19:00', async () => {
    const loadOpeningHours = jest.fn(async () => TEMPLATE_HOURS_18);
    const result = await handleExplainBusinessHoursAndLocationLogic(
      buildDeps({ loadOpeningHours }),
      'biz-1',
      {},
      'opening hours',
    );

    expect(loadOpeningHours).toHaveBeenCalledWith('biz-1');
    expect(result.success).toBe(true);
    expect(result.summary).toContain('09:00–18:00');
    expect(result.summary).not.toMatch(/19:00/);
    expect((result.details as { hoursLabel?: string }).hoursLabel).toBe(
      'Mon–Sat 09:00–18:00; Sun Closed',
    );
    expect(
      (result.details as { openingHoursSummaryLines?: string[] })
        .openingHoursSummaryLines,
    ).toEqual(['Mon–Sat 09:00–18:00', 'Sun Closed']);
  });

  it('e2e-bug.227 — weekday hours use template close, not settings 19:00', async () => {
    const result = await handleExplainBusinessHoursAndLocationLogic(
      buildDeps({ loadOpeningHours: async () => TEMPLATE_HOURS_18 }),
      'biz-1',
      {},
      'When are you open Saturday?',
    );
    expect(result.summary).toContain('Saturday hours: 09:00–18:00');
    expect(result.summary).not.toMatch(/19:00/);
  });

  it('e2e-bug.227 — Sunday closed from templates', async () => {
    const result = await handleExplainBusinessHoursAndLocationLogic(
      buildDeps({ loadOpeningHours: async () => TEMPLATE_HOURS_18 }),
      'biz-1',
      {},
      'Are you open on Sunday?',
    );
    expect(result.summary).toContain('Sunday hours: Closed');
  });

  it('formatBusinessHoursLabel prefers openingHours when provided', () => {
    expect(
      formatBusinessHoursLabel(
        { hours: { open: '09:00', close: '19:00' } },
        null,
        TEMPLATE_HOURS_18,
      ),
    ).toBe('Mon–Sat 09:00–18:00; Sun Closed');
    expect(
      formatBusinessHoursLabel(
        { hours: { open: '09:00', close: '19:00' } },
        'friday',
        TEMPLATE_HOURS_18,
      ),
    ).toBe('09:00–18:00');
  });

  it('explains location and map link', async () => {
    const result = await handleExplainBusinessHoursAndLocationLogic(
      buildDeps(),
      'biz-1',
      {},
      'Where are you located?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Address: 12 Main Street');
    expect(result.summary).toContain('Map:');
  });
});
