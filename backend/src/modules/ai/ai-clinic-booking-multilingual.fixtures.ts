import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ClinicBookingIntent } from './ai-clinic-booking.util.js';

export interface ClinicBookingEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  surface: 'customer' | 'public';
  expectedAction: ClinicBookingIntent;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

export const CLINIC_BOOKING_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian clinic checkout fields (customer app + public booking page):
  - explain_clinic_booking: hy «ինչ գրեմ ախտանիշների դաշտում checkout-ում», «ուղղորդող բժշկի դաշտը», «պետք է լինեմ ծոմավորո՞ւմ լաբ թեստից առաջ», «նախապես այցելության հարցաթերթիկ checkout-ից առաջ»; ru «что писать в поле симптомов при записи», «поле направления врача», «нужно ли голодать перед анализом», «анкета перед checkout». READ checkout field FAQ — NOT explain_data_rights and NOT list_my_test_results.`;

export const MULTILINGUAL_CLINIC_BOOKING_EVAL_SCENARIOS: ClinicBookingEvalScenario[] =
  [
    {
      id: 'hy-customer-symptoms-field',
      locale: 'hy',
      surface: 'customer',
      prompt: 'Ինչ գրեմ ախտանիշների դաշտում checkout-ում',
      expectedAction: 'explain_clinic_booking',
      rescueReason: 'explain_clinic_booking',
      paramsPartial: { aspect: 'symptoms' },
      needsMultilingual: true,
    },
    {
      id: 'hy-public-referral-field',
      locale: 'hy',
      surface: 'public',
      prompt: 'Ուղղորդող բժշկի դաշտը ինչի համար է այս էջում',
      expectedAction: 'explain_clinic_booking',
      rescueReason: 'explain_clinic_booking',
      paramsPartial: { aspect: 'referralNotes' },
      needsMultilingual: true,
    },
    {
      id: 'hy-customer-fasting',
      locale: 'hy',
      surface: 'customer',
      prompt: 'Պետք է լինեմ ծոմավորո՞ւմ այս լաբ թեստից առաջ',
      expectedAction: 'explain_clinic_booking',
      rescueReason: 'explain_clinic_booking',
      paramsPartial: { aspect: 'preparation' },
      needsMultilingual: true,
    },
    {
      id: 'hy-public-intake',
      locale: 'hy',
      surface: 'public',
      prompt: 'Ինչու կա նախապես այցելության հարցաթերթիկ checkout-ից առաջ',
      expectedAction: 'explain_clinic_booking',
      rescueReason: 'explain_clinic_booking',
      paramsPartial: { aspect: 'preVisitIntake' },
      needsMultilingual: true,
    },
    {
      id: 'ru-customer-symptoms-field',
      locale: 'ru',
      surface: 'customer',
      prompt: 'Что писать в поле симптомов при записи в приложении?',
      expectedAction: 'explain_clinic_booking',
      rescueReason: 'explain_clinic_booking',
      paramsPartial: { aspect: 'symptoms' },
      needsMultilingual: true,
    },
    {
      id: 'ru-public-referral-field',
      locale: 'ru',
      surface: 'public',
      prompt: 'Для чего поле направления врача на странице записи?',
      expectedAction: 'explain_clinic_booking',
      rescueReason: 'explain_clinic_booking',
      paramsPartial: { aspect: 'referralNotes' },
      needsMultilingual: true,
    },
    {
      id: 'ru-customer-fasting',
      locale: 'ru',
      surface: 'customer',
      prompt: 'Нужно ли голодать перед этим анализом крови?',
      expectedAction: 'explain_clinic_booking',
      rescueReason: 'explain_clinic_booking',
      paramsPartial: { aspect: 'preparation' },
      needsMultilingual: true,
    },
    {
      id: 'ru-public-intake',
      locale: 'ru',
      surface: 'public',
      prompt: 'Зачем анкета перед checkout на этой странице?',
      expectedAction: 'explain_clinic_booking',
      rescueReason: 'explain_clinic_booking',
      paramsPartial: { aspect: 'preVisitIntake' },
      needsMultilingual: true,
    },
    {
      id: 'ru-public-lipid-prep',
      locale: 'ru',
      surface: 'public',
      prompt: 'Как подготовиться к Lipid panel на странице записи?',
      expectedAction: 'explain_clinic_booking',
      rescueReason: 'explain_clinic_booking',
      paramsPartial: { aspect: 'preparation', serviceName: 'Lipid panel' },
      needsMultilingual: true,
    },
    {
      id: 'hy-customer-checkout-overview',
      locale: 'hy',
      surface: 'customer',
      prompt: 'Բացատրիր կլինիկական checkout դաշտերը հավելվածում',
      expectedAction: 'explain_clinic_booking',
      rescueReason: 'explain_clinic_booking',
      paramsPartial: { aspect: 'all' },
      needsMultilingual: true,
    },
  ];
