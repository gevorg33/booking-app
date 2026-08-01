import {
  buildCheckProvidersSummary,
  mapRecommendedProviders,
} from './ai-provider-availability.util.js';

const fullProvider = {
  id: 'emp-1',
  name: 'Karo Mazmanyan',
  role: 'Cosmetologist',
  averageRating: 4.8,
  reviewCount: 12,
  earliestDateKey: '2026-06-06',
  earliestStartTime: '14:00',
  previewTimes: ['14:00', '14:30', '15:00'],
  matchedServiceId: 'svc-1',
  matchedServiceName: 'Permanent lips',
};

describe('mapRecommendedProviders', () => {
  it('maps full provider rows', () => {
    expect(mapRecommendedProviders([fullProvider])).toEqual([
      {
        id: 'emp-1',
        name: 'Karo Mazmanyan',
        role: 'Cosmetologist',
        earliestDateKey: '2026-06-06',
        earliestStartTime: '14:00',
        previewTimes: ['14:00', '14:30', '15:00'],
        matchedServiceName: 'Permanent lips',
      },
    ]);
  });

  it('fills defaults for sparse provider payloads', () => {
    expect(
      mapRecommendedProviders([
        {
          id: 'emp-2',
          name: 'Anna',
          averageRating: null,
          reviewCount: 0,
          earliestDateKey: undefined as unknown as string,
          earliestStartTime: undefined as unknown as string,
          previewTimes: undefined as unknown as string[],
          matchedServiceId: 'svc-1',
          matchedServiceName: undefined as unknown as string,
        },
      ]),
    ).toEqual([
      {
        id: 'emp-2',
        name: 'Anna',
        role: undefined,
        earliestDateKey: '',
        earliestStartTime: '',
        previewTimes: [],
        matchedServiceName: '',
      },
    ]);
  });
});

describe('buildCheckProvidersSummary', () => {
  it('formats provider lines with preview times and role', () => {
    const result = buildCheckProvidersSummary({
      serviceName: 'Permanent lips',
      dateKey: '2026-06-06',
      providers: [fullProvider],
    });

    expect(result.summary).toContain('1 provider(s) available');
    expect(result.summary).toContain('Karo Mazmanyan (Cosmetologist)');
    expect(result.summary).toContain('14:00, 14:30, 15:00');
    expect(result.summary).toContain('Tap a time slot below');
    expect(result.summary).toContain('6 June 2026');
    expect(result.summary).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result.availableProviders).toEqual(['Karo Mazmanyan']);
    expect(result.availability[0]?.previewTimes).toEqual([
      '14:00',
      '14:30',
      '15:00',
    ]);
  });

  it('uses earliest start time when preview times are missing', () => {
    const result = buildCheckProvidersSummary({
      serviceName: 'Massage',
      dateKey: '2026-06-06',
      providers: [
        {
          ...fullProvider,
          id: 'emp-3',
          name: 'Mary Torgomyan',
          role: undefined,
          previewTimes: [],
          earliestStartTime: '16:30',
        },
      ],
    });

    expect(result.summary).toContain('Mary Torgomyan — 16:30');
    expect(result.summary).not.toContain('Mary Torgomyan (');
  });

  it('falls back to "open" when no times are present', () => {
    const result = buildCheckProvidersSummary({
      serviceName: 'Facial',
      dateKey: '2026-06-06',
      providers: [
        {
          ...fullProvider,
          id: 'emp-4',
          name: 'Sam',
          role: undefined,
          previewTimes: [],
          earliestStartTime: undefined as unknown as string,
        },
      ],
    });

    expect(result.summary).toContain('Sam — open');
  });

  it('formats multiple providers', () => {
    const result = buildCheckProvidersSummary({
      serviceName: 'Haircut',
      dateKey: '2026-06-07',
      providers: [
        fullProvider,
        {
          ...fullProvider,
          id: 'emp-5',
          name: 'Mary Torgomyan',
          previewTimes: ['10:00'],
        },
      ],
    });

    expect(result.availableProviders).toEqual([
      'Karo Mazmanyan',
      'Mary Torgomyan',
    ]);
    expect(result.availability).toHaveLength(2);
    expect(result.summary).toContain('2 provider(s) available');
  });

  it('returns empty availability when no providers match', () => {
    const result = buildCheckProvidersSummary({
      serviceName: 'Massage',
      dateKey: '2026-08-02',
      providers: [],
    });

    expect(result.summary).toContain('No providers are free');
    expect(result.summary).toContain('2 August 2026');
    expect(result.summary).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result.summary).toMatch(/another date|time of day/i);
    expect(result.availableProviders).toEqual([]);
    expect(result.availability).toEqual([]);
  });

  it('suggests morning and afternoon when evening has no providers', () => {
    const result = buildCheckProvidersSummary({
      serviceName: 'massage',
      dateKey: '2026-06-07',
      providers: [],
      timeOfDay: 'evening',
      notBeforeTime: '17:00',
    });

    expect(result.summary).toContain('evening');
    expect(result.summary).toContain('morning');
    expect(result.summary).toContain('afternoon');
  });
});
