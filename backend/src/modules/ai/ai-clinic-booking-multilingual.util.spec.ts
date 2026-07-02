import { MULTILINGUAL_CLINIC_BOOKING_EVAL_SCENARIOS } from './ai-clinic-booking-multilingual.fixtures.js';
import { clinicBookingMultilingualScenarioToEvalCase } from './ai-clinic-booking-multilingual.util.js';

describe('ai-clinic-booking-multilingual.util', () => {
  it.each(MULTILINGUAL_CLINIC_BOOKING_EVAL_SCENARIOS)(
    'maps $id to eval case',
    (scenario) => {
      const evalCase = clinicBookingMultilingualScenarioToEvalCase(scenario);
      expect(evalCase.id).toBe(`clinic-booking-${scenario.id}`);
      expect(evalCase.expect.rescuedAction).toBe('explain_clinic_booking');
      expect(evalCase.surface).toBe(scenario.surface);
      if (scenario.paramsPartial?.aspect) {
        expect(evalCase.expect.paramsPartial?.aspect).toBe(
          scenario.paramsPartial.aspect,
        );
      }
      if (scenario.paramsPartial?.serviceName) {
        expect(evalCase.expect.paramsPartial?.serviceName).toBe(
          scenario.paramsPartial.serviceName,
        );
      }
    },
  );

  it('maps parsed prompt fields when fixture params are omitted', () => {
    const evalCase = clinicBookingMultilingualScenarioToEvalCase({
      id: 'en-fallback',
      locale: 'en',
      surface: 'public',
      prompt: 'Explain the lab prep for Lipid panel',
      expectedAction: 'explain_clinic_booking',
    });

    expect(evalCase.expect.paramsPartial).toEqual({
      aspect: 'preparation',
      serviceName: 'Lipid panel',
    });
  });
});
