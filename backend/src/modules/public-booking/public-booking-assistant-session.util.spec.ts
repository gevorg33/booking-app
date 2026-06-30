import {
  mergePublicAssistantSessionParams,
  parsePublicAssistantSessionValue,
  serializePublicAssistantDiscoverySessionFields,
} from './public-booking-assistant-session.util.js';

describe('public-booking-assistant-session.util (ai-cmd-customer-gap-4)', () => {
  it('parses JSON session fields for OR windows', () => {
    const windows = [
      { date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ];
    expect(
      parsePublicAssistantSessionValue(
        'availabilityWindows',
        JSON.stringify(windows),
      ),
    ).toEqual(windows);
    expect(parsePublicAssistantSessionValue('maxPrice', '50')).toBe(50);
    expect(parsePublicAssistantSessionValue('serviceRank', 'lowest_price')).toBe(
      'lowest_price',
    );
  });

  it('merges serviceRank and availabilityWindows from session on follow-up turn', () => {
    const merged = mergePublicAssistantSessionParams(
      { serviceCategory: 'haircut' },
      {
        maxPrice: '50',
        serviceRank: 'lowest_price',
        availabilityWindows: JSON.stringify([
          { date: 'tomorrow', timeOfDay: 'evening' },
        ]),
        timeOfDay: 'evening',
      },
      'check_availability',
    );
    expect(merged.maxPrice).toBe(50);
    expect(merged.serviceRank).toBe('lowest_price');
    expect(merged.availabilityWindows).toEqual([
      { date: 'tomorrow', timeOfDay: 'evening' },
    ]);
    expect(merged.timeOfDay).toBe('evening');
  });

  it('does not override explicit params with stale session', () => {
    const merged = mergePublicAssistantSessionParams(
      { maxPrice: 80, serviceRank: 'highest_price' },
      { maxPrice: '50', serviceRank: 'lowest_price' },
    );
    expect(merged.maxPrice).toBe(80);
    expect(merged.serviceRank).toBe('highest_price');
  });

  it('does not pin stale serviceId when follow-up names a different service', () => {
    const merged = mergePublicAssistantSessionParams(
      { serviceName: 'facemassage' },
      {
        serviceId: 'deep-tissue-id',
        serviceName: 'Deep tissue massage',
        serviceRank: 'highest_price',
      },
      'book_nearest_slot',
    );
    expect(merged.serviceName).toBe('facemassage');
    expect(merged.serviceId).toBeUndefined();
    expect(merged.serviceRank).toBeUndefined();
  });

  it('merges guide multiturn session fields from prior turn', () => {
    const merged = mergePublicAssistantSessionParams(
      {},
      {
        guideFlowId: 'public-booking-flow',
        guideStepIndex: '2',
        completedSteps: JSON.stringify([0, 1]),
      },
      'guide_user_flow',
    );
    expect(merged.guideFlowId).toBe('public-booking-flow');
    expect(merged.guideStepIndex).toBe(2);
    expect(merged.completedSteps).toEqual([0, 1]);
  });

  it('serializes discovery fields for sessionContext response', () => {
    expect(
      serializePublicAssistantDiscoverySessionFields({
        maxPrice: 50,
        serviceRank: 'highest_price',
        timeOfDay: 'evening',
        availabilityWindows: [{ date: 'tomorrow', timeOfDay: 'evening' }],
        chosenAvailabilityWindow: { date: 'tomorrow', timeOfDay: 'evening' },
        chosenAvailabilityWindowIndex: 0,
      }),
    ).toEqual({
      maxPrice: '50',
      rankedServiceIds: null,
      serviceRank: 'highest_price',
      timeOfDay: 'evening',
      availabilityWindows: JSON.stringify([
        { date: 'tomorrow', timeOfDay: 'evening' },
      ]),
      chosenAvailabilityWindow: JSON.stringify({
        date: 'tomorrow',
        timeOfDay: 'evening',
      }),
      chosenAvailabilityWindowIndex: '0',
    });
  });
});
