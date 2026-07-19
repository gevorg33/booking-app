import {
  TOUR_SERVICE_TYPE,
  applyTourMetadataToServiceMetadata,
  buildTourBookingMetadata,
  buildTourServiceMetadataFromDraft,
  clampTourPaxCount,
  extractTourBookingMetadata,
  extractTourMetadata,
  formatTourDurationBadge,
  isDayLevelTour,
  isTourService,
  multiplyTourPrice,
  resolveRemainingTourSpots,
  resolveTourCatalogServiceByName,
  resolveTourDurationDays,
  sumBookedTourPax,
} from './tour-service.util.js';

describe('tour-service.util', () => {
  it('extracts and applies tour metadata', () => {
    const meta = applyTourMetadataToServiceMetadata(
      { localizedNames: { en: ['Tour'] } },
      {
        serviceType: TOUR_SERVICE_TYPE,
        coverImage: '/img.jpg',
        maxGroupSize: 10,
        difficulty: 'moderate',
        meetingPoint: 'Lobby',
        includedItems: 'Lunch',
        durationDays: 2,
      },
    );
    expect(extractTourMetadata(meta)).toEqual({
      serviceType: TOUR_SERVICE_TYPE,
      coverImage: '/img.jpg',
      maxGroupSize: 10,
      difficulty: 'moderate',
      meetingPoint: 'Lobby',
      includedItems: 'Lunch',
      durationDays: 2,
    });
    expect(isTourService(meta)).toBe(true);
  });

  it('clears tour metadata when serviceType is null', () => {
    const cleared = applyTourMetadataToServiceMetadata(
      {
        serviceType: TOUR_SERVICE_TYPE,
        coverImage: '/x',
        maxGroupSize: 4,
      },
      { serviceType: null },
    );
    expect(extractTourMetadata(cleared)).toBeNull();
  });

  it('builds tour metadata from catalog draft', () => {
    const built = buildTourServiceMetadataFromDraft({
      serviceType: 'tour',
      coverImage: '/t.jpg',
      maxGroupSize: 6,
      difficulty: 'easy',
      durationDays: 1,
    });
    expect(built?.serviceType).toBe(TOUR_SERVICE_TYPE);
    expect(built?.maxGroupSize).toBe(6);
  });

  it('ignores non-tour drafts', () => {
    expect(
      buildTourServiceMetadataFromDraft({ serviceType: 'other' }),
    ).toBeUndefined();
  });

  it('detects day-level tours', () => {
    expect(
      isDayLevelTour({
        durationMinutes: 60,
        metadata: { serviceType: 'salon' },
      }),
    ).toBe(false);
    expect(
      isDayLevelTour({
        durationMinutes: 1440,
        metadata: { serviceType: TOUR_SERVICE_TYPE },
      }),
    ).toBe(true);
    expect(
      isDayLevelTour({
        durationMinutes: 480,
        metadata: { serviceType: TOUR_SERVICE_TYPE, durationDays: 2 },
      }),
    ).toBe(true);
    expect(
      isDayLevelTour({
        durationMinutes: 60,
        metadata: { serviceType: TOUR_SERVICE_TYPE },
      }),
    ).toBe(false);
  });

  it('formats duration badges and resolves days', () => {
    expect(
      formatTourDurationBadge({
        durationMinutes: 4320,
        metadata: { serviceType: TOUR_SERVICE_TYPE, durationDays: 3 },
      }),
    ).toBe('3 days');
    expect(
      resolveTourDurationDays({
        durationMinutes: 480,
        metadata: { serviceType: TOUR_SERVICE_TYPE, durationDays: 1 },
      }),
    ).toBe(1);
  });

  it('builds tour booking metadata with pax and date span', () => {
    const meta = buildTourBookingMetadata({
      paxCount: 3,
      startTime: new Date('2026-06-10T08:00:00.000Z'),
      durationMinutes: 2880,
      durationDays: 2,
      specialRequirements: 'Vegetarian meals',
    });
    expect(meta).toMatchObject({
      paxCount: 3,
      tourStartDate: '2026-06-10',
      tourEndDate: '2026-06-11',
      specialRequirements: 'Vegetarian meals',
    });
    expect(extractTourBookingMetadata(meta).paxCount).toBe(3);
  });

  it('sums booked pax and resolves remaining spots', () => {
    expect(
      sumBookedTourPax([
        { metadata: { paxCount: 2 } },
        { metadata: { paxCount: 3 } },
        { metadata: {} },
      ]),
    ).toBe(6);
    expect(resolveRemainingTourSpots(10, 6)).toBe(4);
    expect(resolveRemainingTourSpots(undefined, 6)).toBeNull();
    expect(resolveRemainingTourSpots(8, 8)).toBe(0);
    expect(resolveRemainingTourSpots(0, 0)).toBeNull();
  });

  it('clamps pax and multiplies tour price', () => {
    expect(clampTourPaxCount(0, 8)).toBe(1);
    expect(clampTourPaxCount(12, 8)).toBe(8);
    expect(multiplyTourPrice(100, 3, true)).toBe(300);
    expect(multiplyTourPrice(100, 3, false)).toBe(100);
  });

  it('clears individual tour fields and handles edge metadata', () => {
    const clearedFields = applyTourMetadataToServiceMetadata(
      {
        serviceType: TOUR_SERVICE_TYPE,
        coverImage: '/old.jpg',
        maxGroupSize: 5,
        difficulty: 'easy',
        meetingPoint: 'A',
        includedItems: 'B',
        durationDays: 2,
      },
      {
        coverImage: '',
        maxGroupSize: 0,
        difficulty: undefined,
        meetingPoint: '',
        includedItems: '',
        durationDays: 0,
      },
    );
    expect(clearedFields.coverImage).toBeUndefined();
    expect(clearedFields.maxGroupSize).toBeUndefined();
    expect(clearedFields.meetingPoint).toBeUndefined();
    expect(extractTourMetadata(null)).toBeNull();
    expect(extractTourMetadata({ serviceType: 'other' })).toBeNull();
  });

  it('formats hour and minute badges', () => {
    expect(
      formatTourDurationBadge({
        durationMinutes: 1440,
        metadata: { serviceType: TOUR_SERVICE_TYPE },
      }),
    ).toBe('1 day');
    expect(
      formatTourDurationBadge({
        durationMinutes: 90,
        metadata: { serviceType: TOUR_SERVICE_TYPE },
      }),
    ).toBe('2h');
    expect(
      formatTourDurationBadge({
        durationMinutes: 20,
        metadata: { serviceType: TOUR_SERVICE_TYPE },
      }),
    ).toBe('20 min');
  });

  it('extracts partial booking metadata safely', () => {
    expect(extractTourBookingMetadata({})).toEqual({});
    expect(
      extractTourBookingMetadata({
        paxCount: 0,
        tourStartDate: 1,
      }),
    ).toEqual({});
    expect(
      applyTourMetadataToServiceMetadata(
        { difficulty: 'easy' },
        { difficulty: 'invalid' as never },
      ).difficulty,
    ).toBeUndefined();
    expect(
      extractTourBookingMetadata({
        paxCount: 2,
        tourStartDate: '2026-06-01',
        tourEndDate: '2026-06-03',
      }),
    ).toEqual({
      paxCount: 2,
      tourStartDate: '2026-06-01',
      tourEndDate: '2026-06-03',
    });
    expect(
      buildTourServiceMetadataFromDraft({
        serviceType: 'tour',
        difficulty: 'not-real',
      })?.difficulty,
    ).toBeUndefined();
    expect(
      applyTourMetadataToServiceMetadata({}, { serviceType: TOUR_SERVICE_TYPE })
        .serviceType,
    ).toBe(TOUR_SERVICE_TYPE);
    expect(clampTourPaxCount(undefined)).toBe(1);
    expect(
      buildTourBookingMetadata({
        paxCount: 1,
        startTime: new Date('2026-07-01T10:00:00.000Z'),
        durationMinutes: 480,
      }).tourEndDate,
    ).toBe('2026-07-01');
    expect(
      buildTourBookingMetadata({
        paxCount: 2,
        startTime: new Date('2026-07-01T10:00:00.000Z'),
        durationMinutes: 480,
        specialRequirements: '  Halal meals  ',
      }).specialRequirements,
    ).toBe('Halal meals');
    expect(
      applyTourMetadataToServiceMetadata(null, { coverImage: '/new.jpg' })
        .coverImage,
    ).toBe('/new.jpg');
    expect(
      buildTourServiceMetadataFromDraft({
        serviceType: 'tour',
        meetingPoint: 'Square',
        includedItems: 'Guide',
      }),
    ).toMatchObject({
      meetingPoint: 'Square',
      includedItems: 'Guide',
    });
  });

  // e2e-bug.105 — short nicknames → realistic AI-generated catalog titles
  it.each([
    { nickname: 'wine tour', catalogName: 'Private Wine Country Day' },
    { nickname: 'mountain trek', catalogName: '3-Day Mountain Trek' },
    { nickname: 'City tour', catalogName: 'Full Day City Tour' },
  ])(
    'resolveTourCatalogServiceByName maps "$nickname" → $catalogName',
    ({ nickname, catalogName }) => {
      const catalog = [
        { id: '1', name: 'Full Day City Tour' },
        { id: '2', name: 'Sunset Coastal Drive' },
        { id: '3', name: '3-Day Mountain Trek' },
        { id: '4', name: 'Weekend Heritage Tour' },
        { id: '5', name: 'Private Wine Country Day' },
      ];
      expect(resolveTourCatalogServiceByName(catalog, nickname)?.name).toBe(
        catalogName,
      );
    },
  );
});
