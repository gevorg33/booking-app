import { FIND_SOONEST_APPOINTMENT_PROMPTS } from './ai-find-soonest-appointment.util.js';
import { rescueFindSoonestAppointmentIntent } from './ai-find-soonest-appointment.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';
import { paymentsDispatchMapHas } from './ai-payments-dispatch.util.js';
import { isAiPaymentsServiceIntentForSurface } from './ai-payments-dispatch.util.js';

describe('customer-ai-command find_soonest_appointment integration (ai-cmd-customer-4.1.3)', () => {
  it.each(FIND_SOONEST_APPOINTMENT_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues find_soonest_appointment for $id',
    (_id, row) => {
      expect(rescueFindSoonestAppointmentIntent(row.prompt, 'unknown')?.action).toBe(
        'find_soonest_appointment',
      );
      expect(rescuePaymentsIntent(row.prompt, 'unknown')?.action).toBe(
        'find_soonest_appointment',
      );
    },
  );

  it('is registered on customer and public payments dispatch', () => {
    expect(paymentsDispatchMapHas('find_soonest_appointment')).toBe(true);
    expect(
      isAiPaymentsServiceIntentForSurface('find_soonest_appointment', 'customer'),
    ).toBe(true);
    expect(
      isAiPaymentsServiceIntentForSurface('find_soonest_appointment', 'public'),
    ).toBe(true);
  });
});
