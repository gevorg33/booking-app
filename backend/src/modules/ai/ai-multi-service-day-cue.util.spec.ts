import {
  hasMultiServiceDayPlanningCue,
  hasMultiServiceDayServicesCue,
} from './ai-multi-service-day-cue.util.js';

describe('ai-multi-service-day-cue.util', () => {
  it('hasMultiServiceDayServicesCue requires two services', () => {
    expect(
      hasMultiServiceDayServicesCue('Massage and facial same afternoon'),
    ).toBe(true);
    expect(hasMultiServiceDayServicesCue('Book massage')).toBe(false);
  });

  it('hasMultiServiceDayPlanningCue matches same-day phrasing', () => {
    expect(
      hasMultiServiceDayPlanningCue('Massage and facial same afternoon'),
    ).toBe(true);
    expect(
      hasMultiServiceDayPlanningCue('Haircut and color — find a time'),
    ).toBe(true);
    expect(hasMultiServiceDayPlanningCue('Book massage and facial')).toBe(
      false,
    );
  });
});
