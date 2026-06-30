import {
  buildBusinessHoursLocationSummary,
  handleExplainBusinessHoursAndLocationLogic,
} from './ai-explain-business-hours-and-location.logic.js';
import type { BusinessHoursLocationLogicDeps } from './ai-explain-business-hours-and-location.logic.js';

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
    expect((result.details as { navigate?: { path: string } }).navigate?.path).toBe(
      'profile',
    );
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
