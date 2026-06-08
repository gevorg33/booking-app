/** Customer / consumer-app package purchase classifier rules (Sprint consumer parity). */
export const CUSTOMER_PACKAGE_BOOKING_CLASSIFIER_RULES = `- book_package: MUTATE — customer self-service package purchase (browse → schedule block → checkout). Triggers: book|buy|purchase|order|get|reserve|schedule + package|bundle|spa day|deal (for me / my account). Requires packageName or packageId when a specific package is named. NOT create_package (dashboard catalog CRUD) or create_package_booking (staff books for a named customer).
- discover_packages: READ — list available service packages on the public catalog. Triggers: what packages|bundles|deals do you have, show packages, browse packages. NOT list_packages (dashboard admin catalog).
- check_package_availability: READ — earliest same-day block for a named package. Triggers: is {package} available, when can I book {package}, package availability. Requires packageName or packageId.
- Package + promo compounds: book_package then promo_code_help when user mentions a promo/discount code with the package.
- Examples:
  - "buy the spa day package" → book_package, packageName=spa day
  - "purchase deluxe bundle for me" → book_package, packageName=deluxe bundle
  - "what packages do you offer?" → discover_packages
  - "is the wellness package available this week?" → check_package_availability, packageName=wellness package`;

export const SIMILAR_CUSTOMER_PACKAGE_PROMPTS = [
  {
    id: 'buy-spa-day',
    prompt: 'Buy the spa day package',
    surface: 'customer' as const,
    expectedAction: 'book_package',
    packageName: 'spa day',
  },
  {
    id: 'purchase-deluxe',
    prompt: 'I want to purchase the Deluxe package',
    surface: 'customer' as const,
    expectedAction: 'book_package',
    packageName: 'Deluxe',
  },
  {
    id: 'discover-packages',
    prompt: 'What packages do you have?',
    surface: 'customer' as const,
    expectedAction: 'discover_packages',
  },
  {
    id: 'package-availability',
    prompt: 'Is the wellness package available tomorrow?',
    surface: 'customer' as const,
    expectedAction: 'check_package_availability',
    packageName: 'wellness package',
  },
  {
    id: 'book-package-hy',
    prompt: 'Ամրագրել սպա օրվա փաթեթը',
    surface: 'customer' as const,
    expectedAction: 'book_package',
  },
  {
    id: 'buy-package-ru',
    prompt: 'Купить пакет Spa Day',
    surface: 'customer' as const,
    expectedAction: 'book_package',
    packageName: 'Spa Day',
  },
];
