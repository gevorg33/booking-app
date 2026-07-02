import { rescueReportBookingProblemIntent } from './ai-report-booking-problem.util.js';
import { REPORT_BOOKING_PROBLEM_RESCUE_SCENARIOS } from './ai-report-booking-problem.fixtures.js';

describe('customer-ai-command report_booking_problem integration (ai-cmd-customer-4.12.3)', () => {
  it.each(REPORT_BOOKING_PROBLEM_RESCUE_SCENARIOS)(
    'rescues report_booking_problem for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueReportBookingProblemIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );
});
