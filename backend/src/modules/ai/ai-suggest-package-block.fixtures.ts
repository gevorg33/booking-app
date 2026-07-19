export type SuggestPackageBlockPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'suggest_package_block';
  rescueReason: 'package_block_suggestion';
  packageName?: string;
};

export const SUGGEST_PACKAGE_BLOCK_CLASSIFIER_RULES = `- suggest_package_block: READ — find the earliest bookable time block for a named package (all lines with one provider), without listing every open slot. Triggers: earliest time for the spa day package, suggest a block for the wellness package, when's the soonest I can do this package, find me a time for the package. Requires packageId or packageName. NOT check_package_availability (lists all available blocks/lines), NOT discover_packages (list packages only), NOT book_package (mutate purchase).`;

export const SUGGEST_PACKAGE_BLOCK_PROMPTS: readonly SuggestPackageBlockPromptFixture[] =
  [
    {
      id: 'earliest-spa-day-block-public',
      prompt: 'Suggest the earliest block for the spa day package',
      surface: 'public',
      expectedAction: 'suggest_package_block',
      rescueReason: 'package_block_suggestion',
      packageName: 'Spa Day',
    },
    {
      id: 'soonest-wellness-package-public',
      prompt: "When's the soonest I can do the wellness package?",
      surface: 'public',
      expectedAction: 'suggest_package_block',
      rescueReason: 'package_block_suggestion',
      packageName: 'wellness package',
    },
    {
      id: 'find-time-deluxe-bundle-public',
      prompt: 'Find me a time for the deluxe bundle package',
      surface: 'public',
      expectedAction: 'suggest_package_block',
      rescueReason: 'package_block_suggestion',
      packageName: 'deluxe bundle',
    },
    {
      id: 'earliest-spa-day-block-customer',
      prompt: 'Suggest the earliest block for the spa day package',
      surface: 'customer',
      expectedAction: 'suggest_package_block',
      rescueReason: 'package_block_suggestion',
      packageName: 'Spa Day',
    },
    {
      id: 'soonest-wellness-package-customer',
      prompt: "What's the soonest time for the wellness package?",
      surface: 'customer',
      expectedAction: 'suggest_package_block',
      rescueReason: 'package_block_suggestion',
      packageName: 'wellness package',
    },
  ];
