export type GetDirectionsToSalonAspect = 'directions' | 'parking' | 'all';

export type GetDirectionsToSalonPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'get_directions_to_salon';
  aspect: GetDirectionsToSalonAspect;
  rescueReason: 'salon_directions';
};

export const GET_DIRECTIONS_TO_SALON_PROMPTS: readonly GetDirectionsToSalonPromptFixture[] =
  [
    {
      id: 'directions-to-salon-customer',
      prompt: 'Directions to the salon',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'how-get-salon-customer',
      prompt: 'How do I get to the salon?',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'navigate-salon-customer',
      prompt: 'Navigate to the salon',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'maps-directions-customer',
      prompt: 'Open Google Maps directions to the salon',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'where-park-customer',
      prompt: 'Where do I park?',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'parking',
      rescueReason: 'salon_directions',
    },
    {
      id: 'parking-nearby-customer',
      prompt: 'Where can I park nearby?',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'parking',
      rescueReason: 'salon_directions',
    },
    {
      id: 'parking-appointment-customer',
      prompt: 'Where should I park for my appointment?',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'parking',
      rescueReason: 'salon_directions',
    },
    {
      id: 'get-there-customer',
      prompt: 'How do I get there for my visit?',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'salon-location-directions-customer',
      prompt: 'Give me directions to your location',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'drive-to-salon-customer',
      prompt: 'How do I drive to the salon?',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'directions-and-parking-customer',
      prompt: 'Directions and parking for the salon',
      surface: 'customer',
      expectedAction: 'get_directions_to_salon',
      aspect: 'all',
      rescueReason: 'salon_directions',
    },
    {
      id: 'directions-to-salon-public',
      prompt: 'Directions to the salon',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'how-get-salon-public',
      prompt: 'How do I get to the salon?',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'navigate-salon-public',
      prompt: 'Navigate to the salon',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'maps-directions-public',
      prompt: 'Google Maps directions to your salon',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'where-park-public',
      prompt: 'Where do I park?',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'parking',
      rescueReason: 'salon_directions',
    },
    {
      id: 'parking-nearby-public',
      prompt: 'Where can I park nearby?',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'parking',
      rescueReason: 'salon_directions',
    },
    {
      id: 'parking-visit-public',
      prompt: 'Where should I park for my visit?',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'parking',
      rescueReason: 'salon_directions',
    },
    {
      id: 'get-there-public',
      prompt: 'How do I get there?',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'drive-to-salon-public',
      prompt: 'How do I drive to your salon?',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'directions-location-public',
      prompt: 'Show me directions to your location',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'directions',
      rescueReason: 'salon_directions',
    },
    {
      id: 'directions-parking-public',
      prompt: 'Directions and parking info',
      surface: 'public',
      expectedAction: 'get_directions_to_salon',
      aspect: 'all',
      rescueReason: 'salon_directions',
    },
  ] as const;

export const GET_DIRECTIONS_TO_SALON_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-directions',
    prompt: 'Directions to the salon',
    misclassifiedAction: 'unknown',
    expectedAction: 'get_directions_to_salon',
  },
  {
    id: 'business-info-to-directions',
    prompt: 'How do I get to the salon?',
    misclassifiedAction: 'business_info',
    expectedAction: 'get_directions_to_salon',
  },
  {
    id: 'hours-location-to-directions',
    prompt: 'Where do I park for my appointment?',
    misclassifiedAction: 'explain_business_hours_and_location',
    expectedAction: 'get_directions_to_salon',
  },
] as const;
