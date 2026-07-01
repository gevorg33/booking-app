export type SwitchSalonTenantPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'switch_salon_tenant';
  rescueReason: 'switch_salon_tenant';
  salonName?: string;
  salonSlug?: string;
};

export const CUSTOMER_SWITCH_SALON_TENANT_CLASSIFIER_RULES = `- switch_salon_tenant: READ — consumer mobile: switch to another remembered salon tenant (ConsumerTenantSwitcher). Uses recentSalons client context to resolve salonName or slug. Triggers: "Go back to Salon X", "Switch to Glow Nails", "Open demo-salon". Set salonName when a salon is named. NOT find_my_saved_salons (list all saved salons), NOT list_providers, NOT book_appointment.`;

export const SWITCH_SALON_TENANT_PROMPTS: readonly SwitchSalonTenantPromptFixture[] =
  [
    {
      id: 'go-back-salon-customer',
      prompt: 'Go back to Glow Nails',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Glow Nails',
    },
    {
      id: 'switch-to-salon-customer',
      prompt: 'Switch to Demo Salon',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Demo Salon',
    },
    {
      id: 'open-salon-customer',
      prompt: 'Open Bliss Spa',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Bliss Spa',
    },
    {
      id: 'return-to-salon-customer',
      prompt: 'Return to my usual salon Glow Nails',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Glow Nails',
    },
    {
      id: 'take-me-to-salon-customer',
      prompt: 'Take me to Demo Salon',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Demo Salon',
    },
    {
      id: 'switch-salon-slug-customer',
      prompt: 'Switch to demo-salon',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonSlug: 'demo-salon',
    },
    {
      id: 'change-salon-customer',
      prompt: 'Change salon to Bliss Spa',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Bliss Spa',
    },
    {
      id: 'go-back-other-salon-customer',
      prompt: 'Go back to the other salon I visited',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
    },
    {
      id: 'open-previous-salon-customer',
      prompt: 'Open the salon I booked at yesterday',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
    },
    {
      id: 'switch-tenant-customer',
      prompt: 'Switch tenant to Glow Nails',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Glow Nails',
    },
    {
      id: 'jump-salon-customer',
      prompt: 'Jump to Demo Salon app',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Demo Salon',
    },
    {
      id: 'back-to-saved-salon-customer',
      prompt: 'Back to Bliss Spa please',
      surface: 'customer',
      expectedAction: 'switch_salon_tenant',
      rescueReason: 'switch_salon_tenant',
      salonName: 'Bliss Spa',
    },
  ];

export const SWITCH_SALON_TENANT_RESCUE_SCENARIOS = [
  {
    id: 'unknown-switch-salon',
    prompt: 'Go back to Glow Nails',
    misclassifiedAction: 'unknown',
    expectedAction: 'switch_salon_tenant' as const,
  },
  {
    id: 'find-saved-to-switch',
    prompt: 'Switch to Demo Salon',
    misclassifiedAction: 'find_my_saved_salons',
    expectedAction: 'switch_salon_tenant' as const,
  },
] as const;
