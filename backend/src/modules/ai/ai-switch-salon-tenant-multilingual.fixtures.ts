import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type SwitchSalonTenantMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'switch_salon_tenant';
  rescueReason: 'switch_salon_tenant';
  salonName?: string;
};

export const SWITCH_SALON_TENANT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian tenant switch (customer mobile):
  - switch_salon_tenant: hy «վերադառնալ Glow Nails salon», «փոխել salon-ը»; ru «вернуться в Glow Nails», «переключиться на Demo Salon». NOT find_my_saved_salons.`;

export const SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS: readonly SwitchSalonTenantMultilingualScenario[] =
  [
    {
      id: 'switch-salon-hy-customer',
      locale: 'hy',
      prompt: 'Վերադառնալ Glow Nails salon',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Glow Nails',
    },
    {
      id: 'switch-salon-ru-customer',
      locale: 'ru',
      prompt: 'Вернуться в Demo Salon',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Demo Salon',
    },
    {
      id: 'open-salon-ru-customer',
      locale: 'ru',
      prompt: 'Открыть Bliss Spa',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Bliss Spa',
    },
    {
      id: 'change-salon-hy-customer',
      locale: 'hy',
      prompt: 'Փոխել salon-ը Demo Salon',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Demo Salon',
    },
    {
      id: 'go-back-ru-customer',
      locale: 'ru',
      prompt: 'Переключиться на Glow Nails',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Glow Nails',
    },
    {
      id: 'return-hy-customer',
      locale: 'hy',
      prompt: 'Բացել Bliss Spa salon-ը',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Bliss Spa',
    },
  ];
