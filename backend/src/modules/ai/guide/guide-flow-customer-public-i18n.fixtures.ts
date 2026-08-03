/** Top customer/public guide flows — ai-guide-1.5.5 (20 topicIds + common step labels). */
export interface CustomerPublicGuideFlowDef {
  id: string;
  topicId: string;
  keyPrefix: string;
  fields: readonly string[];
}

export const TOP_CUSTOMER_PUBLIC_GUIDE_FLOWS: readonly CustomerPublicGuideFlowDef[] =
  [
    {
      id: 'common-steps',
      topicId: 'guide-flow-common',
      keyPrefix: 'guide.flows.common',
      fields: ['step1', 'step2', 'step3', 'step4', 'step5'],
    },
    {
      id: 'consumer-getting-started',
      topicId: 'consumer-getting-started',
      keyPrefix: 'guide.flows.customer.gettingStarted',
      fields: ['title', 'summary', 'step1', 'step2', 'step3', 'step4', 'step5'],
    },
    {
      id: 'consumer-tabs',
      topicId: 'consumer-tabs',
      keyPrefix: 'guide.flows.customer.tabs',
      fields: ['title', 'summary', 'step1', 'step2', 'step3'],
    },
    {
      id: 'consumer-booking-flow',
      topicId: 'consumer-booking-flow',
      keyPrefix: 'guide.flows.customer.bookingFlow',
      fields: [
        'title',
        'summary',
        'step1',
        'step2',
        'step3',
        'step4',
        'step1Title',
        'step2Title',
        'step3Title',
        'step4Title',
      ],
    },
    {
      id: 'consumer-packages',
      topicId: 'consumer-packages-gift-cards',
      keyPrefix: 'guide.flows.customer.packages',
      fields: [
        'title',
        'summary',
        'step1',
        'step2',
        'step3',
        'step1Title',
        'step2Title',
        'step3Title',
      ],
    },
    {
      id: 'consumer-account',
      topicId: 'consumer-account',
      keyPrefix: 'guide.flows.customer.account',
      fields: ['title', 'summary', 'step1', 'step2', 'step3'],
    },
    {
      id: 'consumer-assistant',
      topicId: 'consumer-assistant',
      keyPrefix: 'guide.flows.customer.assistant',
      fields: ['title', 'summary', 'step1', 'step2', 'step3'],
    },
    {
      id: 'consumer-activation-welcome',
      topicId: 'consumer-activation-welcome',
      keyPrefix: 'guide.flows.customer.activation.welcome',
      fields: ['title', 'summary', 'step1', 'step2', 'step3'],
    },
    {
      id: 'consumer-activation-salon',
      topicId: 'consumer-activation-salon',
      keyPrefix: 'guide.flows.customer.activation.salon',
      fields: ['title', 'summary', 'step1', 'step2', 'step3'],
    },
    {
      id: 'consumer-activation-service',
      topicId: 'consumer-activation-service',
      keyPrefix: 'guide.flows.customer.activation.service',
      fields: ['title', 'summary', 'step1', 'step2', 'step3'],
    },
    {
      id: 'consumer-activation-slot',
      topicId: 'consumer-activation-slot',
      keyPrefix: 'guide.flows.customer.activation.slot',
      fields: ['title', 'summary', 'step1', 'step2', 'step3'],
    },
    {
      id: 'consumer-activation-confirm',
      topicId: 'consumer-activation-confirm',
      keyPrefix: 'guide.flows.customer.activation.confirm',
      fields: ['title', 'summary', 'step1', 'step2', 'step3'],
    },
    {
      id: 'consumer-clinic',
      topicId: 'consumer-clinic',
      keyPrefix: 'guide.flows.overlays.clinic.consumer',
      fields: ['title', 'summary', 'step1', 'step2', 'step3'],
    },
    {
      id: 'consumer-tour-packages',
      topicId: 'consumer-tour-packages',
      keyPrefix: 'guide.flows.overlays.tour.packages',
      fields: ['title', 'summary', 'step1', 'step2'],
    },
    {
      id: 'public-booking-funnel',
      topicId: 'public-booking-funnel',
      keyPrefix: 'guide.flows.public.bookingFunnel',
      fields: [
        'title',
        'summary',
        'step1',
        'step2',
        'step3',
        'step1Title',
        'step2Title',
        'step3Title',
      ],
    },
    {
      id: 'public-professionals',
      topicId: 'public-booking-professionals',
      keyPrefix: 'guide.flows.public.professionals',
      fields: [
        'title',
        'summary',
        'step1',
        'step2',
        'step3',
        'step1Title',
        'step2Title',
        'step3Title',
      ],
    },
    {
      id: 'public-services',
      topicId: 'public-booking-services',
      keyPrefix: 'guide.flows.public.services',
      fields: [
        'title',
        'summary',
        'step1',
        'step2',
        'step3',
        'step1Title',
        'step2Title',
        'step3Title',
      ],
    },
    {
      id: 'public-checkout',
      topicId: 'public-checkout',
      keyPrefix: 'guide.flows.public.checkout',
      fields: [
        'title',
        'summary',
        'step1',
        'step2',
        'step3',
        'step1Title',
        'step2Title',
        'step3Title',
      ],
    },
    {
      id: 'public-availability',
      topicId: 'public-availability',
      keyPrefix: 'guide.flows.public.availability',
      fields: ['title', 'summary', 'step1', 'step2', 'step3'],
    },
    {
      id: 'public-tour-checkout',
      topicId: 'public-tour-checkout',
      keyPrefix: 'guide.flows.overlays.tour.checkout',
      fields: ['title', 'summary', 'step1', 'step2', 'step3'],
    },
  ] as const;

/** Canonical HY/RU strings: `guide-flow-customer-public-i18n.{hy,ru}.json` (sync via `scripts/sync-customer-public-guide-i18n.py`). */
