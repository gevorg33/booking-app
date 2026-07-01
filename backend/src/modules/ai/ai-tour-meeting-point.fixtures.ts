/** Customer/public classifier rules for tour meeting point + arrival (ai-cmd-customer-4.10.6). */
export const TOUR_MEETING_POINT_CLASSIFIER_RULES = `- explain_tour_meeting_point: READ — tour meeting point and arrival time for a booked tour or catalog tour service: meetingPoint metadata, departure start time from the customer's booking, and tourStartDate when stored. Triggers: "Where do we meet?", "What time should I arrive?", "Meeting point for my tour", "Where is the pickup for Wine Country tour on this page?". Set aspect to meeting_point|arrival_time|all when clear. Uses session booking when signed in; optional serviceName for catalog lookup. NOT explain_preparation_notes (clinic fasting/bring-list prep), NOT get_directions_to_salon (salon address navigation), NOT explain_tour_booking (group size/pricing/duration), NOT confirm_my_booking_details (time/service summary without meeting metadata), NOT explain_tour_day_slots (slot display mechanics).
- Examples:
  - "Where do we meet for my tour?" → explain_tour_meeting_point, aspect=meeting_point
  - "What time should I arrive for my Mountain Trek?" → explain_tour_meeting_point, aspect=arrival_time, serviceName=Mountain Trek
  - "Where is the meeting point for Wine Country tour on this booking page?" → explain_tour_meeting_point, aspect=meeting_point, serviceName=Wine Country
  - "When should I arrive for my group tour booking?" → explain_tour_meeting_point, aspect=arrival_time
  - "Почему у City Tour указана точка встречи на странице записи?" → explain_tour_meeting_point, serviceName=City Tour
  - "Որտեղ ենք հանդիպում իմ տուրի համար" → explain_tour_meeting_point, aspect=meeting_point`;

export type TourMeetingPointAspect = 'meeting_point' | 'arrival_time' | 'all';

export type ExplainTourMeetingPointPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_tour_meeting_point';
  aspect: TourMeetingPointAspect;
  rescueReason: 'explain_tour_meeting_point';
  serviceName?: string;
};

export const EXPLAIN_TOUR_MEETING_POINT_PROMPTS: readonly ExplainTourMeetingPointPromptFixture[] =
  [
    {
      id: 'where-meet-my-tour-customer',
      prompt: 'Where do we meet for my tour?',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
    },
    {
      id: 'arrival-time-mountain-trek-customer',
      prompt: 'What time should I arrive for my Mountain Trek?',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'arrival_time',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'Mountain Trek',
    },
    {
      id: 'meeting-point-booking-customer',
      prompt: 'What is the meeting point for my tour booking?',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
    },
    {
      id: 'when-arrive-group-tour-customer',
      prompt: 'When should I arrive for my group tour booking?',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'arrival_time',
      rescueReason: 'explain_tour_meeting_point',
    },
    {
      id: 'pickup-city-tour-customer',
      prompt: 'Where is the pickup point for my City Tour?',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'City Tour',
    },
    {
      id: 'meeting-and-arrival-wine-customer',
      prompt:
        'Where do we meet and what time should I arrive for Wine Country tour?',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'all',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'Wine Country',
    },
    {
      id: 'catalog-meeting-wine-public',
      prompt:
        'Where is the meeting point for Wine Country tour on this booking page?',
      surface: 'public',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'Wine Country',
    },
    {
      id: 'where-meet-my-tour-public',
      prompt: 'Where do we meet for my tour?',
      surface: 'public',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
    },
    {
      id: 'arrival-time-sunset-hike-public',
      prompt: 'What time should I arrive for Sunset Hike?',
      surface: 'public',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'arrival_time',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'Sunset Hike',
    },
    {
      id: 'pickup-garni-public',
      prompt: 'What is the pickup location for Garni Temple tour here?',
      surface: 'public',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'Garni Temple',
    },
    {
      id: 'when-leave-trek-public',
      prompt: 'When do we leave for the 3-Day Mountain Trek?',
      surface: 'public',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'arrival_time',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: '3-Day Mountain Trek',
    },
    {
      id: 'meeting-point-catalog-city-public',
      prompt: 'Show me the meeting point for City Tour on the booking page',
      surface: 'public',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'City Tour',
    },
    {
      id: 'arrival-my-booking-customer',
      prompt: 'What time do I need to arrive for my booked tour tomorrow?',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'arrival_time',
      rescueReason: 'explain_tour_meeting_point',
    },
    {
      id: 'where-should-i-arrive-customer',
      prompt: 'Where should I arrive for my Wine Country tour reservation?',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'Wine Country',
    },
    {
      id: 'meeting-point-excursion-public',
      prompt: 'Where is the meeting point for the city excursion tour?',
      surface: 'public',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'city excursion',
    },
    {
      id: 'arrival-time-hike-customer',
      prompt: 'What time should I arrive for my hike tour?',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'arrival_time',
      rescueReason: 'explain_tour_meeting_point',
    },
  ];

export const EXPLAIN_TOUR_MEETING_POINT_RESCUE_SCENARIOS = [
  {
    id: 'prep-notes-to-tour-meeting',
    prompt: 'Where do we meet for my tour?',
    surface: 'customer' as const,
    misclassifiedAction: 'explain_preparation_notes',
  },
  {
    id: 'tour-booking-to-meeting',
    prompt:
      'Where is the meeting point for Wine Country tour on this booking page?',
    surface: 'public' as const,
    misclassifiedAction: 'explain_tour_booking',
  },
  {
    id: 'directions-to-meeting',
    prompt: 'What time should I arrive for my Mountain Trek?',
    surface: 'customer' as const,
    misclassifiedAction: 'confirm_my_booking_details',
  },
  {
    id: 'unknown-to-tour-meeting-public',
    prompt: 'Where do we meet for my tour?',
    surface: 'public' as const,
    misclassifiedAction: 'unknown',
  },
] as const;
