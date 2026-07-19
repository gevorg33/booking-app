import { EXPLAIN_APPOINTMENT_TAX_PROMPTS } from './ai-appointment-tax.fixtures.js';
import { EXPLAIN_APPOINTMENT_TAX_MULTILINGUAL_PROMPTS } from './ai-appointment-tax-multilingual.fixtures.js';
import {
  parseExplainAppointmentTaxFromPrompt,
  rescueAppointmentTaxIntent,
} from './ai-appointment-tax.util.js';

describe('ai-appointment-tax.util (ai-cmd-tax-11)', () => {
  it.each(EXPLAIN_APPOINTMENT_TAX_PROMPTS)(
    'rescues explain appointment tax prompt $id',
    ({ prompt }) => {
      expect(rescueAppointmentTaxIntent(prompt, 'unknown')).toEqual({
        action: 'explain_appointment_tax',
        rescueReason: 'explain_appointment_tax',
      });
    },
  );

  it('parses booking id from prompt', () => {
    expect(
      parseExplainAppointmentTaxFromPrompt(
        'Show inclusive vs exclusive tax on appointment bk-tax-001',
      ),
    ).toEqual({ bookingId: 'bk-tax-001' });
  });

  it('does not rescue support metadata lookup prompts', () => {
    expect(
      rescueAppointmentTaxIntent(
        'Lookup tax metadata for booking bk-tax-001',
        'unknown',
      ),
    ).toBeNull();
  });

  it.each(EXPLAIN_APPOINTMENT_TAX_MULTILINGUAL_PROMPTS)(
    'rescues explain appointment tax prompt $id (ai-cmd-provider-5.17.1)',
    ({ prompt }) => {
      expect(rescueAppointmentTaxIntent(prompt, 'unknown')).toEqual({
        action: 'explain_appointment_tax',
        rescueReason: 'explain_appointment_tax',
      });
    },
  );
});
