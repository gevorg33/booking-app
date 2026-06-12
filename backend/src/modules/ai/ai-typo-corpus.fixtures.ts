import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
} from './eval/ai-command-eval.types.js';
import { generateTypoVariants } from './ai-typo-corpus.util.js';

export type TypoCorpusSeed = {
  id: string;
  prompt: string;
  surface?: AiCommandEvalCase['surface'];
  locale?: 'en';
  expect: AiCommandEvalExpectation;
};

export type TypoCorpusEntry = {
  id: string;
  seedId: string;
  variantKind: ReturnType<typeof generateTypoVariants>[number]['kind'];
  prompt: string;
  surface?: TypoCorpusSeed['surface'];
  locale: 'en';
  expect: AiCommandEvalExpectation;
};

/** High-traffic customer rescue prompts — acc-2.5 seed set (phase 1). */
export const TYPO_CORPUS_SEEDS: TypoCorpusSeed[] = [
  {
    id: 'self-service-cancel',
    prompt: 'Cancel my booking',
    surface: 'customer',
    locale: 'en',
    expect: {
      rescuedAction: 'cancel_my_booking',
      rescueReason: 'cancel_my',
      useSurfaceSelfServiceRescue: true,
    },
  },
  {
    id: 'self-service-reschedule',
    prompt: 'Reschedule my appointment',
    surface: 'customer',
    locale: 'en',
    expect: {
      rescuedAction: 'reschedule_my_booking',
      rescueReason: 'reschedule_my',
      useSurfaceSelfServiceRescue: true,
    },
  },
  {
    id: 'self-service-list',
    prompt: 'List my appointments',
    surface: 'customer',
    locale: 'en',
    expect: {
      rescuedAction: 'list_my_appointments',
      rescueReason: 'list_appointments',
      useSurfaceSelfServiceRescue: true,
    },
  },
  {
    id: 'self-service-book-package',
    prompt: 'Book spa day package',
    surface: 'customer',
    locale: 'en',
    expect: {
      rescuedAction: 'book_package',
      rescueReason: 'book_package',
      useSurfaceSelfServiceRescue: true,
    },
  },
  {
    id: 'marketing-promo-help',
    prompt: 'How do promo codes work',
    surface: 'customer',
    locale: 'en',
    expect: {
      rescuedAction: 'promo_code_help',
      rescueReason: 'promo_help',
      useSurfaceMarketingGrowthRescue: true,
    },
  },
  {
    id: 'checkout-tax-line',
    prompt: 'Why is there a tax line on checkout in the consumer app?',
    surface: 'customer',
    locale: 'en',
    expect: {
      rescuedAction: 'explain_consumer_checkout_tax',
      rescueReason: 'explain_consumer_checkout_tax',
      useSurfaceConsumerCheckoutTaxRescue: true,
      paramsPartial: { aspect: 'checkout' },
    },
  },
  {
    id: 'consumer-adoption-rebook',
    prompt: 'Rebook my last appointment',
    surface: 'customer',
    locale: 'en',
    expect: {
      rescuedAction: 'rebook_last_appointment',
      rescueReason: 'rebook_last_appointment',
    },
  },
  {
    id: 'self-service-add-cart',
    prompt: 'Add massage to my cart',
    surface: 'customer',
    locale: 'en',
    expect: {
      rescuedAction: 'add_services_to_cart',
      rescueReason: 'add_cart',
      useSurfaceSelfServiceRescue: true,
    },
  },
];

function buildTypoCorpusEntries(): TypoCorpusEntry[] {
  const rows: TypoCorpusEntry[] = [];
  for (const seed of TYPO_CORPUS_SEEDS) {
    for (const variant of generateTypoVariants(seed.prompt)) {
      rows.push({
        id: `${seed.id}-${variant.kind}`,
        seedId: seed.id,
        variantKind: variant.kind,
        prompt: variant.prompt,
        surface: seed.surface,
        locale: 'en',
        expect: seed.expect,
      });
    }
  }
  return rows;
}

export const TYPO_CORPUS_ENTRIES: TypoCorpusEntry[] = buildTypoCorpusEntries();
