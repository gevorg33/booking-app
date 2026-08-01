import {
  E2E264_EXTRACT_CASES,
  E2E264_LIVE_SCENARIOS,
} from './ai-e2e264-multi-service-step-customer.fixtures.js';
import {
  extractCustomerNameForMultiServiceStepDone,
  parseMarkMultiServiceStepDoneFromPrompt,
} from './ai-provider-mark-multi-service-step-done.util.js';

describe('e2e-bug.264: multi-service step-done customerName extract', () => {
  it.each(E2E264_EXTRACT_CASES)(
    '$id — extractCustomerNameForMultiServiceStepDone',
    ({ prompt, params, expectedCustomerName }) => {
      expect(
        extractCustomerNameForMultiServiceStepDone(prompt, params ?? {}),
      ).toBe(expectedCustomerName);
    },
  );

  it('parseMarkMultiServiceStepDoneFromPrompt includes customerName', () => {
    expect(
      parseMarkMultiServiceStepDoneFromPrompt('Finish step 1 for Spa Day QA'),
    ).toEqual({ stepIndex: 1, customerName: 'Spa Day QA' });
    expect(
      parseMarkMultiServiceStepDoneFromPrompt(
        'Complete blowdry leg for Jane',
      ),
    ).toEqual({ serviceName: 'blowdry', customerName: 'Jane' });
  });

  it('live scenario inventory covers customerName + multi-group clarify', () => {
    const ids = E2E264_LIVE_SCENARIOS.map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'e2e264-live-customerName-step1-no-bookingId',
        'e2e264-live-no-name-still-clarify',
        'e2e264-live-two-groups-same-name-clarify',
        'e2e264-live-session-bookingId-still-works',
      ]),
    );
    expect(E2E264_LIVE_SCENARIOS).toHaveLength(6);
  });
});
