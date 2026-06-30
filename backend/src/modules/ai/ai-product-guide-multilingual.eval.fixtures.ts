import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export interface ProductGuideMultilingualEvalScenario {
  id: string;
  locale: Exclude<AiEvalLocale, 'translit'>;
  surface: CommandSurface;
  prompt: string;
  rescueFromAction: string;
  expectedAction: string;
  expectedReason?: string;
  topicId?: string;
  route?: string;
  activationStep?: 'welcome' | 'salon' | 'service' | 'slot' | 'confirm';
}

/** HY/RU product guide eval prompts — ai-guide-1.6.4 (four surfaces). */
export const MULTILINGUAL_PRODUCT_GUIDE_EVAL_SCENARIOS: readonly ProductGuideMultilingualEvalScenario[] =
  [
    {
      id: 'dashboard-hy-online-payment',
      locale: 'hy',
      surface: 'dashboard',
      prompt: 'Որտեղից միացնեմ online payment-ը service-ի համար',
      rescueFromAction: 'configure_service_online_payment',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_navigation',
    },
    {
      id: 'dashboard-ru-screen-help',
      locale: 'ru',
      surface: 'dashboard',
      prompt: 'Что я могу сделать на этой странице?',
      rescueFromAction: 'unknown',
      expectedAction: 'explain_current_screen',
      expectedReason: 'product_guide_screen',
    },
    {
      id: 'provider-hy-staff-invite',
      locale: 'hy',
      surface: 'provider',
      prompt: 'Ինչի համար է staff invite link-ը',
      rescueFromAction: 'unknown',
      expectedAction: 'explain_staff_invite',
      expectedReason: 'provider_product_guide',
    },
    {
      id: 'provider-ru-mark-paid',
      locale: 'ru',
      surface: 'provider',
      prompt: 'Где отметить клиента как оплатившего?',
      rescueFromAction: 'mark_paid',
      expectedAction: 'guide_user_flow',
      expectedReason: 'product_guide_navigation',
    },
    {
      id: 'customer-hy-gift-cards',
      locale: 'hy',
      surface: 'customer',
      prompt: 'Ինչպե՞ս են աշխատում gift card-ները app-ում',
      rescueFromAction: 'unknown',
      expectedAction: 'explain_app_feature',
      expectedReason: 'customer_app_guide',
    },
    {
      id: 'customer-ru-profile',
      locale: 'ru',
      surface: 'customer',
      prompt: 'Как обновить профиль в приложении?',
      rescueFromAction: 'unknown',
      expectedAction: 'guide_user_flow',
      expectedReason: 'customer_app_guide',
    },
    {
      id: 'customer-hy-activation-welcome',
      locale: 'hy',
      surface: 'customer',
      prompt: 'Ինչ է տեղի ունենում welcome screen-ում',
      rescueFromAction: 'unknown',
      expectedAction: 'explain_current_screen',
      expectedReason: 'customer_app_guide',
      activationStep: 'welcome',
      topicId: 'consumer-activation-welcome',
    },
    {
      id: 'public-hy-booking-help',
      locale: 'hy',
      surface: 'public',
      prompt: 'Քայլ առ քայլ ցույց տուր booking-ը',
      rescueFromAction: 'unknown',
      expectedAction: 'booking_help',
      expectedReason: 'public_booking_help',
    },
    {
      id: 'public-ru-checkout-walkthrough',
      locale: 'ru',
      surface: 'public',
      prompt: 'Проведи меня по шагам checkout и оплаты',
      rescueFromAction: 'explain_checkout_tax',
      expectedAction: 'booking_help',
      expectedReason: 'public_booking_help',
    },
    {
      id: 'public-hy-book-on-page',
      locale: 'hy',
      surface: 'public',
      prompt: 'Ինչպե՞ս ամրագրեմ appointment այս page-ում',
      rescueFromAction: 'book_appointment',
      expectedAction: 'booking_help',
      expectedReason: 'public_booking_help',
    },
    {
      id: 'dashboard-hy-schedule-templates',
      locale: 'hy',
      surface: 'dashboard',
      prompt: 'Շաբաթական schedule template-ները ինչպե՞ս setup անեմ?',
      rescueFromAction: 'unknown',
      expectedAction: 'guide_user_flow',
      topicId: 'dashboard.core.schedule',
    },
    {
      id: 'provider-ru-today-tab',
      locale: 'ru',
      surface: 'provider',
      prompt: 'Что показывает вкладка Today?',
      rescueFromAction: 'unknown',
      expectedAction: 'explain_provider_app_tabs',
      expectedReason: 'provider_product_guide',
      topicId: 'provider-today-calendar',
    },
    {
      id: 'customer-ru-packages',
      locale: 'ru',
      surface: 'customer',
      prompt: 'Как купить пакет услуг в приложении?',
      rescueFromAction: 'unknown',
      expectedAction: 'guide_user_flow',
      expectedReason: 'customer_app_guide',
      topicId: 'consumer-packages-gift-cards',
      route: '/s/packages',
    },
    {
      id: 'public-ru-availability',
      locale: 'ru',
      surface: 'public',
      prompt: 'Как посмотреть свободные слоты на сайте?',
      rescueFromAction: 'unknown',
      expectedAction: 'booking_help',
      expectedReason: 'public_booking_help',
      topicId: 'public-availability',
    },
  ] as const;
