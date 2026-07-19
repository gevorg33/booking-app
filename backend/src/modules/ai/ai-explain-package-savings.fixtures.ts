export type ExplainPackageSavingsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_package_savings';
  rescueReason: 'package_savings';
  packageName?: string;
};

export const CUSTOMER_PUBLIC_EXPLAIN_PACKAGE_SAVINGS_CLASSIFIER_RULES = `- explain_package_savings: READ — compare a service package/bundle price vs booking included services separately (à la carte). Triggers: is the bundle cheaper than separate, package savings, how much do I save on spa day package, worth buying the package vs individually, deal on the deluxe bundle / deal compared to separate services. Set packageName when the user names a package/bundle/spa day. Summarize regularTotal, packagePrice, savings, and per-line breakdown. NOT explain_cancel_policy (casual "whats the deal if i cancel" / what happens if I cancel — cancellation rules, not package pricing), NOT compare_services (two individual catalog services without a package), NOT discover_packages (list packages only), NOT check_package_availability (slot availability), NOT explain_service_price (single service card price), NOT book_package (mutate purchase).`;

export const EXPLAIN_PACKAGE_SAVINGS_PROMPTS: readonly ExplainPackageSavingsPromptFixture[] =
  [
    {
      id: 'bundle-cheaper-than-separate-public',
      prompt: 'Is the bundle cheaper than separate?',
      surface: 'public',
      expectedAction: 'explain_package_savings',
      rescueReason: 'package_savings',
    },
    {
      id: 'spa-day-savings-public',
      prompt: 'How much do I save on the spa day package?',
      surface: 'public',
      expectedAction: 'explain_package_savings',
      rescueReason: 'package_savings',
      packageName: 'Spa Day',
    },
    {
      id: 'package-vs-individual-public',
      prompt:
        'Is the wellness package worth it vs booking services individually?',
      surface: 'public',
      expectedAction: 'explain_package_savings',
      rescueReason: 'package_savings',
      packageName: 'wellness package',
    },
    {
      id: 'compare-package-separate-public',
      prompt: 'Compare spa day package price to booking separately',
      surface: 'public',
      expectedAction: 'explain_package_savings',
      rescueReason: 'package_savings',
      packageName: 'Spa Day',
    },
    {
      id: 'bundle-deal-public',
      prompt: 'What is the deal on the deluxe bundle?',
      surface: 'public',
      expectedAction: 'explain_package_savings',
      rescueReason: 'package_savings',
      packageName: 'deluxe bundle',
    },
    {
      id: 'package-savings-public',
      prompt: 'Show package savings for spa day',
      surface: 'public',
      expectedAction: 'explain_package_savings',
      rescueReason: 'package_savings',
      packageName: 'Spa Day',
    },
    {
      id: 'bundle-cheaper-customer',
      prompt: 'Is the bundle cheaper than booking separate?',
      surface: 'customer',
      expectedAction: 'explain_package_savings',
      rescueReason: 'package_savings',
    },
    {
      id: 'spa-day-savings-customer',
      prompt: 'How much cheaper is the spa day package?',
      surface: 'customer',
      expectedAction: 'explain_package_savings',
      rescueReason: 'package_savings',
      packageName: 'Spa Day',
    },
    {
      id: 'package-worth-it-customer',
      prompt: 'Is the spa day package worth buying vs separate services?',
      surface: 'customer',
      expectedAction: 'explain_package_savings',
      rescueReason: 'package_savings',
      packageName: 'Spa Day',
    },
    {
      id: 'save-on-package-customer',
      prompt: 'How much do I save if I buy the wellness package?',
      surface: 'customer',
      expectedAction: 'explain_package_savings',
      rescueReason: 'package_savings',
      packageName: 'wellness package',
    },
    {
      id: 'a-la-carte-customer',
      prompt: 'Spa day package vs à la carte pricing',
      surface: 'customer',
      expectedAction: 'explain_package_savings',
      rescueReason: 'package_savings',
      packageName: 'Spa Day',
    },
    {
      id: 'package-discount-customer',
      prompt: 'Explain savings on the deluxe bundle package',
      surface: 'customer',
      expectedAction: 'explain_package_savings',
      rescueReason: 'package_savings',
      packageName: 'deluxe bundle',
    },
  ];

export const EXPLAIN_PACKAGE_SAVINGS_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-discover-packages',
    prompt: 'Is the bundle cheaper than separate?',
    misclassifiedAction: 'discover_packages',
    surface: 'public' as const,
  },
  {
    id: 'misclassified-compare-services',
    prompt: 'How much do I save on the spa day package?',
    misclassifiedAction: 'compare_services',
    surface: 'customer' as const,
  },
  {
    id: 'misclassified-check-availability',
    prompt:
      'Is the wellness package worth it vs booking services individually?',
    misclassifiedAction: 'check_package_availability',
    surface: 'public' as const,
  },
  {
    id: 'misclassified-explain-service-price',
    prompt: 'Compare spa day package price to booking separately',
    misclassifiedAction: 'explain_service_price',
    surface: 'customer' as const,
  },
] as const;
