import type { ExplainClinicBookingFieldsPromptFixture } from './ai-explain-clinic-booking-fields.fixtures.js';

export const EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_CLASSIFIER_RULES = `- explain_clinic_booking_fields HY/RU: hy «ինչու՞ ID», «դ/passport», «ծննդյան ամսաթիվ», «ապահովագրություն», «արտակարգ կոնտակտ»; ru «зачем ID», «паспорт», «дата рождения», «страховка», «экстренный контакт». Clinic identity/intake fields — NOT explain_clinic_booking symptoms/referral.`;

export type ExplainClinicBookingFieldsMultilingualScenario =
  ExplainClinicBookingFieldsPromptFixture & {
    locale: 'hy' | 'ru';
  };

const CLINIC_FIELDS_I18N: Record<
  string,
  {
    hy: string;
    ru: string;
    aspect?: ExplainClinicBookingFieldsPromptFixture['aspect'];
  }
> = {
  'why-id-customer': {
    hy: 'Ինչու՞ եք խնդրում իմ ID-ն',
    ru: 'Зачем вы спрашиваете мой ID?',
    aspect: 'governmentId',
  },
  'dob-customer': {
    hy: 'Ինչու՞ է պետք ծննդյան ամսաթիվը գրանցման ժամանակ',
    ru: 'Зачем нужна дата рождения при записи?',
    aspect: 'dateOfBirth',
  },
  'insurance-customer': {
    hy: 'Ինչու՞ է ապահովագրության դաշտը checkout-ում',
    ru: 'Зачем поле страховки на checkout?',
    aspect: 'insurance',
  },
  'emergency-contact-customer': {
    hy: 'Ինչու՞ է պետք արտակարգ կոնտակտ intake-ում',
    ru: 'Зачем экстренный контакт в анкете?',
    aspect: 'emergencyContact',
  },
  'intake-customer': {
    hy: 'Ինչու՞ է նախապես այցելության հարցաթերթիկում ID',
    ru: 'Зачем в анкете перед визитом спрашивают ID?',
    aspect: 'intakeQuestion',
  },
};

function buildExplainClinicBookingFieldsMultilingualScenarios(): ExplainClinicBookingFieldsMultilingualScenario[] {
  const rows: ExplainClinicBookingFieldsMultilingualScenario[] = [];
  for (const [id, i18n] of Object.entries(CLINIC_FIELDS_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${id}-${locale}`,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        surface: 'customer',
        expectedAction: 'explain_clinic_booking_fields',
        rescueReason: 'clinic_booking_fields',
        locale,
        ...(i18n.aspect ? { aspect: i18n.aspect } : {}),
      });
    }
  }
  return rows;
}

export const EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_SCENARIOS: ExplainClinicBookingFieldsMultilingualScenario[] =
  buildExplainClinicBookingFieldsMultilingualScenarios();
