import {
  buildGetDirectionsToSalonSummary,
  handleGetDirectionsToSalonLogic,
  inferGetDirectionsToSalonAspect,
} from './ai-get-directions-to-salon.logic.js';
import type { GetDirectionsToSalonLogicDeps } from './ai-get-directions-to-salon.logic.js';

function makeDeps(
  overrides: Partial<GetDirectionsToSalonLogicDeps> = {},
): GetDirectionsToSalonLogicDeps {
  return {
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        name: 'Glow Salon',
        address: '12 Main St, Yerevan',
        settings: {
          location: {
            mapEmbedHtml:
              '<iframe src="https://www.google.com/maps/embed?pb=abc"></iframe>',
            parkingCopy: 'Street parking on Main St.',
          },
        },
      })),
    } as unknown as GetDirectionsToSalonLogicDeps['businessRepo'],
    ...overrides,
  };
}

describe('ai-get-directions-to-salon.logic (ai-cmd-customer-4.3.3)', () => {
  it('inferGetDirectionsToSalonAspect splits directions, parking, and all', () => {
    expect(inferGetDirectionsToSalonAspect('Directions to the salon')).toBe(
      'directions',
    );
    expect(inferGetDirectionsToSalonAspect('Where do I park?')).toBe('parking');
    expect(
      inferGetDirectionsToSalonAspect('Directions and parking for the salon'),
    ).toBe('all');
  });

  it('buildGetDirectionsToSalonSummary covers directions, parking, and all', () => {
    const business = {
      name: 'Glow Salon',
      address: '12 Main St',
    } as any;
    const links = {
      directionsUrl: 'https://maps.example/dir',
      mapsUrl: 'https://maps.example/embed',
      address: '12 Main St',
    };

    expect(
      buildGetDirectionsToSalonSummary({
        business,
        aspect: 'directions',
        links,
        parkingCopy: null,
      }),
    ).toContain('directions');
    expect(
      buildGetDirectionsToSalonSummary({
        business,
        aspect: 'parking',
        links,
        parkingCopy: 'Garage behind the salon',
      }),
    ).toContain('parking');
    expect(
      buildGetDirectionsToSalonSummary({
        business,
        aspect: 'all',
        links,
        parkingCopy: 'Garage behind the salon',
      }),
    ).toContain('directions');
  });

  it('returns directions URL, map link, address, and parking copy', async () => {
    const result = await handleGetDirectionsToSalonLogic(
      makeDeps(),
      'biz-1',
      { aspect: 'all' },
      'Directions to the salon',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('get_directions_to_salon');
    expect(result.details.directionsUrl).toContain('google.com/maps/dir');
    expect(result.details.mapsUrl).toContain('google.com/maps/embed');
    expect(result.details.address).toBe('12 Main St, Yerevan');
    expect(result.details.parkingCopy).toBe('Street parking on Main St.');
    expect(result.details.navigate).toEqual({ path: 'profile', query: {} });
  });

  it('returns directions-only summary when address is missing', async () => {
    const deps = makeDeps({
      businessRepo: {
        findOne: jest.fn(async () => ({
          id: 'biz-1',
          name: 'Glow Salon',
          address: '',
          settings: {},
        })),
      } as unknown as GetDirectionsToSalonLogicDeps['businessRepo'],
    });

    const result = await handleGetDirectionsToSalonLogic(
      deps,
      'biz-1',
      { aspect: 'directions' },
      'Directions to the salon',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('not listed on the profile yet');
    expect(result.details.directionsUrl).toBeNull();
  });

  it('returns parking-only summary when profile has no parking copy', async () => {
    const deps = makeDeps({
      businessRepo: {
        findOne: jest.fn(async () => ({
          id: 'biz-1',
          name: 'Glow Salon',
          address: '12 Main St, Yerevan',
          settings: {},
        })),
      } as unknown as GetDirectionsToSalonLogicDeps['businessRepo'],
    });

    const result = await handleGetDirectionsToSalonLogic(
      deps,
      'biz-1',
      { aspect: 'parking' },
      'Where do I park?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('not listed on the profile yet');
  });

  it('returns failure when business is missing', async () => {
    const deps = makeDeps({
      businessRepo: {
        findOne: jest.fn(async () => null),
      } as unknown as GetDirectionsToSalonLogicDeps['businessRepo'],
    });

    const result = await handleGetDirectionsToSalonLogic(
      deps,
      'missing',
      {},
      'Directions to the salon',
    );

    expect(result.success).toBe(false);
    expect(result.action).toBe('get_directions_to_salon');
  });
});
