export type SalonProfileAspect =
  | 'overview'
  | 'photos'
  | 'reviews'
  | 'social'
  | 'all';

export type ExplainSalonProfilePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_salon_profile';
  aspect?: SalonProfileAspect;
  rescueReason: 'salon_profile';
};

export const CUSTOMER_PUBLIC_EXPLAIN_SALON_PROFILE_CLASSIFIER_RULES = `- explain_salon_profile: READ — customer app or public booking web: open the salon profile page (SalonProfilePage) with business overview — logo, tagline, description, contact, map embed, and social links. Triggers: "Tell me about this salon", "Show photos and reviews", "Salon profile", "About the salon", "View salon details", "What's your salon about?". Set aspect to overview|photos|reviews|social|all when clear. Navigate to /profile. NOT business_info (inline contact dump without profile navigation focus), NOT explain_business_hours_and_location (hours/address/parking specifics), NOT get_directions_to_salon (turn-by-turn directions), NOT explain_provider_specialty (named stylist bio), NOT explain_professional_profile (stylist profile page), NOT list_providers (team roster only), NOT booking_help (how to book).`;

const EXPLAIN_SALON_PROFILE_EN_PROMPTS = [
  {
    id: 'tell-me-about-salon',
    prompt: 'Tell me about this salon',
    aspect: 'overview' as const,
  },
  {
    // e2e-bug.191 — slash "business / salon info" must not become provider specialty.
    id: 'tell-me-about-business-slash-salon-info',
    prompt: 'Tell me about this business / salon info',
    aspect: 'overview' as const,
  },
  {
    id: 'tell-me-about-this-business',
    prompt: 'Tell me about this business',
    aspect: 'overview' as const,
  },
  {
    id: 'photos-and-reviews',
    prompt: 'Show photos and reviews',
    aspect: 'photos' as const,
  },
  {
    id: 'salon-profile',
    prompt: 'Salon profile',
    aspect: 'overview' as const,
  },
  {
    id: 'about-the-salon',
    prompt: 'About the salon',
    aspect: 'overview' as const,
  },
  {
    id: 'what-is-place-like',
    prompt: 'What is this place like?',
    aspect: 'overview' as const,
  },
  {
    id: 'view-salon-details',
    prompt: 'View salon details',
    aspect: 'overview' as const,
  },
  {
    id: 'salon-about',
    prompt: "What's your salon about?",
    aspect: 'overview' as const,
  },
  {
    id: 'show-profile-page',
    prompt: 'Show me the salon profile page',
    aspect: 'all' as const,
  },
  {
    id: 'social-links',
    prompt: 'Show social media links',
    aspect: 'social' as const,
  },
  {
    id: 'about-your-business',
    prompt: 'Tell me about your business',
    aspect: 'overview' as const,
  },
] as const;

function buildExplainSalonProfilePrompts(): ExplainSalonProfilePromptFixture[] {
  const rows: ExplainSalonProfilePromptFixture[] = [];
  for (const entry of EXPLAIN_SALON_PROFILE_EN_PROMPTS) {
    for (const surface of ['customer', 'public'] as const) {
      rows.push({
        id: `${entry.id}-${surface}`,
        prompt: entry.prompt,
        surface,
        expectedAction: 'explain_salon_profile',
        aspect: entry.aspect,
        rescueReason: 'salon_profile',
      });
    }
  }
  return rows;
}

export const EXPLAIN_SALON_PROFILE_PROMPTS: readonly ExplainSalonProfilePromptFixture[] =
  buildExplainSalonProfilePrompts();

export const EXPLAIN_SALON_PROFILE_RESCUE_SCENARIOS = [
  {
    id: 'business-info-to-salon-profile',
    prompt: 'Tell me about this salon',
    misclassifiedAction: 'business_info',
    expectedAction: 'explain_salon_profile' as const,
  },
  {
    // e2e-bug.191 — specialty misroute rescue.
    id: 'provider-specialty-to-salon-profile-slash',
    prompt: 'Tell me about this business / salon info',
    misclassifiedAction: 'explain_provider_specialty',
    expectedAction: 'explain_salon_profile' as const,
  },
  {
    id: 'provider-specialty-to-salon-profile-this-business',
    prompt: 'Tell me about this business',
    misclassifiedAction: 'explain_provider_specialty',
    expectedAction: 'explain_salon_profile' as const,
  },
  {
    id: 'booking-help-to-salon-profile',
    prompt: 'About the salon',
    misclassifiedAction: 'booking_help',
    expectedAction: 'explain_salon_profile' as const,
  },
  {
    id: 'unknown-to-salon-profile',
    prompt: 'Show photos and reviews',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_salon_profile' as const,
  },
  {
    id: 'list-providers-to-salon-profile',
    prompt: 'Salon profile',
    misclassifiedAction: 'list_providers',
    expectedAction: 'explain_salon_profile' as const,
  },
] as const;

/** e2e-bug.191 — must NOT classify/rescue as explain_provider_specialty. */
export const EXPLAIN_PROVIDER_SPECIALTY_SALON_ABOUT_NEGATIVES = [
  {
    id: 'neg-tell-me-about-this-salon',
    prompt: 'Tell me about this salon',
    expectedActions: ['explain_salon_profile', 'business_info'] as const,
  },
  {
    id: 'neg-tell-me-about-this-business',
    prompt: 'Tell me about this business',
    expectedActions: ['explain_salon_profile', 'business_info'] as const,
  },
  {
    id: 'neg-tell-me-about-business-slash-salon-info',
    prompt: 'Tell me about this business / salon info',
    expectedActions: ['explain_salon_profile', 'business_info'] as const,
  },
  {
    id: 'neg-about-this-business',
    prompt: 'about this business',
    expectedActions: ['explain_salon_profile', 'business_info'] as const,
  },
  {
    id: 'neg-salon-info',
    prompt: 'salon info',
    expectedActions: ['business_info', 'explain_salon_profile'] as const,
  },
  {
    id: 'neg-business-info-please',
    prompt: 'business info please',
    expectedActions: ['business_info', 'explain_salon_profile'] as const,
  },
  {
    id: 'neg-tell-me-about-the-salon',
    prompt: 'Tell me about the salon',
    expectedActions: ['explain_salon_profile', 'business_info'] as const,
  },
  {
    id: 'neg-tell-me-about-your-business',
    prompt: 'Tell me about your business',
    expectedActions: ['explain_salon_profile', 'business_info'] as const,
  },
] as const;
