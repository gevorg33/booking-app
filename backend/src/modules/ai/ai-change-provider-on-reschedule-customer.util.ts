export const CUSTOMER_CHANGE_PROVIDER_ON_RESCHEDULE_CLASSIFIER_RULES = `- change_provider_on_reschedule: MUTATE — logged-in customer/consumer app self-serve reschedule where the customer also wants a different stylist/specialist for the new slot, not just a new date/time. Triggers: change/switch provider, specialist, stylist, therapist, or employee, combined with "on reschedule" / "when I reschedule". Reschedule flow only — the customer keeps the same booking and picks a new provider as part of moving it. NOT reschedule_my_booking (date/time move without a provider change), NOT switch_provider_same_time (keeps the same slot, no reschedule), NOT pick_provider_for_service (fresh booking, no reschedule context).`;

export type ChangeProviderOnReschedulePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'change_provider_on_reschedule';
};

export const CHANGE_PROVIDER_ON_RESCHEDULE_PROMPTS: readonly ChangeProviderOnReschedulePromptFixture[] =
  [
    {
      id: 'switch-different-specialist-when-reschedule-customer',
      prompt: 'Switch to a different specialist when I reschedule',
      surface: 'customer',
      expectedAction: 'change_provider_on_reschedule',
    },
    {
      id: 'change-stylist-on-reschedule-customer',
      prompt: 'Change my stylist on reschedule',
      surface: 'customer',
      expectedAction: 'change_provider_on_reschedule',
    },
    {
      id: 'different-therapist-when-reschedule-appointment-customer',
      prompt: 'I want a different therapist when I reschedule my appointment',
      surface: 'customer',
      expectedAction: 'change_provider_on_reschedule',
    },
    {
      id: 'switch-provider-on-reschedule-customer',
      prompt: 'Switch provider on reschedule',
      surface: 'customer',
      expectedAction: 'change_provider_on_reschedule',
    },
    {
      id: 'change-specialist-when-reschedule-booking-customer',
      prompt: 'Change the specialist when I reschedule my booking',
      surface: 'customer',
      expectedAction: 'change_provider_on_reschedule',
    },
    {
      id: 'can-switch-stylist-on-reschedule-customer',
      prompt: 'Can I switch stylist on reschedule?',
      surface: 'customer',
      expectedAction: 'change_provider_on_reschedule',
    },
    {
      id: 'different-employee-when-reschedule-customer',
      prompt: 'Different employee when I reschedule',
      surface: 'customer',
      expectedAction: 'change_provider_on_reschedule',
    },
    {
      id: 'change-provider-when-reschedule-visit-customer',
      prompt: 'Change provider when I reschedule my visit',
      surface: 'customer',
      expectedAction: 'change_provider_on_reschedule',
    },
    {
      id: 'switch-therapist-on-reschedule-customer',
      prompt: 'Switch my therapist on reschedule',
      surface: 'customer',
      expectedAction: 'change_provider_on_reschedule',
    },
    {
      id: 'different-stylist-when-reschedule-customer',
      prompt: "I'd like a different stylist when I reschedule",
      surface: 'customer',
      expectedAction: 'change_provider_on_reschedule',
    },
    {
      id: 'change-specialist-on-reschedule-customer',
      prompt: 'Change specialist on reschedule',
      surface: 'customer',
      expectedAction: 'change_provider_on_reschedule',
    },
  ];
