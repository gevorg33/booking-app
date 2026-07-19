/**
 * e2e-bug.157 — multi-service catalog package must NOT route to gift-card bundle.
 */
export const E2E157_CREATE_PACKAGE_SCENARIOS = [
  {
    id: 'e2e157-qa-test-bundle',
    prompt:
      'Create a new package called QA Test Bundle combining facemassage and Neck Massage services for 80 dollars',
    expectedAction: 'create_package' as const,
    rescueReason: 'create_package',
    packageName: 'QA Test Bundle',
    serviceNames: ['facemassage', 'Neck Massage'],
  },
  {
    id: 'e2e157-spa-day-package',
    prompt: 'Create Spa Day package with massage + facial',
    expectedAction: 'create_package' as const,
    rescueReason: 'create_package',
    packageName: 'Spa Day',
    serviceNames: ['massage', 'facial'],
  },
  {
    id: 'e2e157-package-called-combo',
    prompt:
      'Create a package called Weekend Glow combining Haircut and Facial for 100 dollars',
    expectedAction: 'create_package' as const,
    rescueReason: 'create_package',
    packageName: 'Weekend Glow',
    serviceNames: ['Haircut', 'Facial'],
  },
] as const;

export const E2E157_GIFT_CARD_BUNDLE_STILL_MATCHES = [
  {
    id: 'e2e157-gift-card-bundle-explicit',
    prompt: 'create gift card bundle haircut beard',
    expectedAction: 'create_gift_card_bundle' as const,
  },
  {
    id: 'e2e157-gift-card-bundle-named',
    prompt:
      'Create a gift card bundle called Spa Trio with haircut + beard + facial',
    expectedAction: 'create_gift_card_bundle' as const,
  },
] as const;
