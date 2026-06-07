import { EventType } from '../../../events/event-types.js';
import { ClinicTestResultReleasedListener } from './clinic-test-result-released.listener.js';

describe('ClinicTestResultReleasedListener', () => {
  const notificationsService = {
    sendClinicResultReady: jest.fn(async () => undefined),
  };

  const listener = new ClinicTestResultReleasedListener(
    notificationsService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends result-ready notification on test_result.released event', async () => {
    await listener.handleTestResultReleased({
      id: 'evt-1',
      eventType: EventType.TEST_RESULT_RELEASED,
      aggregateType: 'clinic_test_result',
      aggregateId: 'result-1',
      businessId: 'biz-1',
      payload: { resultId: 'result-1' },
    } as any);

    expect(notificationsService.sendClinicResultReady).toHaveBeenCalledWith(
      'result-1',
    );
  });
});
