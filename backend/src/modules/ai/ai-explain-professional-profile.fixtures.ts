/** Customer/public classifier rules for provider profile navigation (ai-cmd-customer-4.11.5). */
export const EXPLAIN_PROFESSIONAL_PROFILE_CLASSIFIER_RULES = `- explain_professional_profile: READ — open a stylist's profile page or the team professionals list to view services, specialty copy, and bio. Triggers: "Show me Anna's services", "Open Maria's profile", "What services does James offer?", "Browse stylists", "What does this stylist specialize in?" (on a profile). Set aspect to named_provider_profile when a person is named (providerName), current_provider_profile when referring to this stylist/provider from session (employeeId), or browse_professionals for team/profile list navigation. NOT explain_provider_specialty (chat answer about who fits a topic or tell-me-about bio), NOT pick_provider_for_service (pre-select to book), NOT list_providers (plain roster), NOT recommend_specialists (ranked picks), NOT check_availability (slot search).
- Examples:
  - "Show me Anna's services" → explain_professional_profile, aspect=named_provider_profile, providerName=Anna
  - "Open Maria's profile" → explain_professional_profile, aspect=named_provider_profile, providerName=Maria
  - "What does this stylist specialize in?" → explain_professional_profile, aspect=current_provider_profile
  - "Browse stylists" → explain_professional_profile, aspect=browse_professionals
  - "Who is best for curly hair?" → explain_provider_specialty (NOT explain_professional_profile)
  - "Tell me about Anna" → explain_provider_specialty (NOT explain_professional_profile)`;

export type ProfessionalProfileAspect =
  | 'named_provider_profile'
  | 'current_provider_profile'
  | 'browse_professionals';

export type ExplainProfessionalProfilePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_professional_profile';
  aspect: ProfessionalProfileAspect;
  providerName?: string;
  rescueReason: 'professional_profile';
};

export const EXPLAIN_PROFESSIONAL_PROFILE_PROMPTS: readonly ExplainProfessionalProfilePromptFixture[] =
  [
    {
      id: 'show-anna-services-customer',
      prompt: "Show me Anna's services",
      surface: 'customer',
      expectedAction: 'explain_professional_profile',
      aspect: 'named_provider_profile',
      providerName: 'Anna',
      rescueReason: 'professional_profile',
    },
    {
      id: 'open-maria-profile-customer',
      prompt: "Open Maria's profile",
      surface: 'customer',
      expectedAction: 'explain_professional_profile',
      aspect: 'named_provider_profile',
      providerName: 'Maria',
      rescueReason: 'professional_profile',
    },
    {
      id: 'what-services-james-offers-customer',
      prompt: 'What services does James offer?',
      surface: 'customer',
      expectedAction: 'explain_professional_profile',
      aspect: 'named_provider_profile',
      providerName: 'James',
      rescueReason: 'professional_profile',
    },
    {
      id: 'view-sophie-profile-customer',
      prompt: "View Sophie's professional profile",
      surface: 'customer',
      expectedAction: 'explain_professional_profile',
      aspect: 'named_provider_profile',
      providerName: 'Sophie',
      rescueReason: 'professional_profile',
    },
    {
      id: 'see-emma-services-customer',
      prompt: "See Emma's services",
      surface: 'customer',
      expectedAction: 'explain_professional_profile',
      aspect: 'named_provider_profile',
      providerName: 'Emma',
      rescueReason: 'professional_profile',
    },
    {
      id: 'this-stylist-specialize-customer',
      prompt: 'What does this stylist specialize in?',
      surface: 'customer',
      expectedAction: 'explain_professional_profile',
      aspect: 'current_provider_profile',
      rescueReason: 'professional_profile',
    },
    {
      id: 'this-provider-services-customer',
      prompt: "Show this provider's services",
      surface: 'customer',
      expectedAction: 'explain_professional_profile',
      aspect: 'current_provider_profile',
      rescueReason: 'professional_profile',
    },
    {
      id: 'browse-stylists-customer',
      prompt: 'Browse stylists',
      surface: 'customer',
      expectedAction: 'explain_professional_profile',
      aspect: 'browse_professionals',
      rescueReason: 'professional_profile',
    },
    {
      id: 'show-team-profiles-customer',
      prompt: 'Show team profiles',
      surface: 'customer',
      expectedAction: 'explain_professional_profile',
      aspect: 'browse_professionals',
      rescueReason: 'professional_profile',
    },
    {
      id: 'show-anna-services-public',
      prompt: "Show me Anna's services",
      surface: 'public',
      expectedAction: 'explain_professional_profile',
      aspect: 'named_provider_profile',
      providerName: 'Anna',
      rescueReason: 'professional_profile',
    },
    {
      id: 'open-maria-profile-public',
      prompt: "Open Maria's profile",
      surface: 'public',
      expectedAction: 'explain_professional_profile',
      aspect: 'named_provider_profile',
      providerName: 'Maria',
      rescueReason: 'professional_profile',
    },
    {
      id: 'what-services-james-offers-public',
      prompt: 'What services does James offer?',
      surface: 'public',
      expectedAction: 'explain_professional_profile',
      aspect: 'named_provider_profile',
      providerName: 'James',
      rescueReason: 'professional_profile',
    },
    {
      id: 'view-alex-profile-public',
      prompt: "View Alex's profile",
      surface: 'public',
      expectedAction: 'explain_professional_profile',
      aspect: 'named_provider_profile',
      providerName: 'Alex',
      rescueReason: 'professional_profile',
    },
    {
      id: 'this-stylist-specialize-public',
      prompt: 'What does this stylist specialize in?',
      surface: 'public',
      expectedAction: 'explain_professional_profile',
      aspect: 'current_provider_profile',
      rescueReason: 'professional_profile',
    },
    {
      id: 'browse-professionals-public',
      prompt: 'Browse professionals',
      surface: 'public',
      expectedAction: 'explain_professional_profile',
      aspect: 'browse_professionals',
      rescueReason: 'professional_profile',
    },
    {
      id: 'view-all-stylists-public',
      prompt: 'View all stylists',
      surface: 'public',
      expectedAction: 'explain_professional_profile',
      aspect: 'browse_professionals',
      rescueReason: 'professional_profile',
    },
  ];

export const EXPLAIN_PROFESSIONAL_PROFILE_RESCUE_SCENARIOS = [
  {
    id: 'rescue-from-explain-provider-specialty',
    prompt: "Show me Anna's services",
    misclassifiedAction: 'explain_provider_specialty',
  },
  {
    id: 'rescue-from-list-providers',
    prompt: 'Browse stylists',
    misclassifiedAction: 'list_providers',
  },
  {
    id: 'rescue-from-pick-provider',
    prompt: "Open Maria's profile",
    misclassifiedAction: 'pick_provider_for_service',
  },
  {
    id: 'rescue-from-recommend-specialists',
    prompt: 'What does this stylist specialize in?',
    misclassifiedAction: 'recommend_specialists',
  },
] as const;
