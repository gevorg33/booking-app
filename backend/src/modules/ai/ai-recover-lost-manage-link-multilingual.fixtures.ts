import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { GetManageLinkDelivery } from './ai-get-manage-link.fixtures.js';

export type RecoverLostManageLinkMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'recover_lost_manage_link';
  rescueReason: 'recover_manage_link';
  delivery?: GetManageLinkDelivery;
};

export const RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian recover lost manage link (customer + public booking):
  - recover_lost_manage_link: hy «կորցրել եմ հաստատման նամակը», «ուղարկիր manage link-ը anna@example.com»; ru «потерял письмо с подтверждением», «перешлите ссылку на ivan@test.ru», «отправьте SMS со ссылкой на запись». Guest email/phone lookup — NOT get_manage_link, NOT share_my_booking.`;

export const RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_SCENARIOS: readonly RecoverLostManageLinkMultilingualScenario[] =
  [
    {
      id: 'lost-email-hy-customer',
      locale: 'hy',
      prompt: 'Կորցրել եմ հաստատման նամակը — ուղարկիր կառավարման հղումը',
      surface: 'customer',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'auto',
    },
    {
      id: 'lost-email-ru-public',
      locale: 'ru',
      prompt:
        'Потерял письмо с подтверждением — перешлите ссылку для управления',
      surface: 'public',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'auto',
    },
    {
      id: 'guest-email-hy-customer',
      locale: 'hy',
      prompt: 'Ուղարկիր manage link-ը anna@example.com հասցեին',
      surface: 'customer',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'email',
    },
    {
      id: 'guest-email-ru-public',
      locale: 'ru',
      prompt: 'Перешлите ссылку на управление записью на ivan@test.ru',
      surface: 'public',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'email',
    },
    {
      id: 'guest-phone-hy-customer',
      locale: 'hy',
      prompt: 'SMS-ով ուղարկիր booking link-ը 091234567 հեռախոսին',
      surface: 'customer',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'sms',
    },
    {
      id: 'guest-phone-ru-public',
      locale: 'ru',
      prompt: 'Отправьте SMS со ссылкой на запись на номер 5551234567',
      surface: 'public',
      expectedAction: 'recover_lost_manage_link',
      rescueReason: 'recover_manage_link',
      delivery: 'sms',
    },
  ];
