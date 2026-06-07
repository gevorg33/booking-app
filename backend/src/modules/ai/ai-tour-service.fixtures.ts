/** Dashboard classifier rules for tour services (ai-cmd-tour-1–4). */
export const TOUR_SERVICE_CLASSIFIER_RULES = `- configure_tour_service: MUTATE — enable tour mode and set tour metadata on one catalog service (serviceType=tour, maxGroupSize, difficulty, durationDays, meetingPoint, coverImage, includedItems). Triggers: mark/set/enable + service name + tour; max N people/guests/pax/group size; difficulty easy|moderate|challenging; meeting point; duration days. Updates service.metadata tour fields — NOT create_service (new catalog row), NOT update_service_prices (bulk %), NOT configure_multi_service_settings (visit service count limits), and NOT explain_tour_services (read list).
- explain_tour_services: READ — list tour catalog services (group sizes, cover images, difficulty) and individual upcoming tour bookings with pax / tourStartDate–tourEndDate. Triggers: explain/show + tour services/tours catalog; who's booked on a named tour. Optional serviceName filter. NOT configure_tour_service (mutate metadata), NOT list_upcoming_tour_departures (departure-date aggregation with remaining capacity), NOT explain_tour_booking_record (one booking metadata), NOT list_services (general catalog), and NOT list_bookings (all appointment types).
- explain_tour_booking_record: READ — explain one tour booking's paxCount, tourStartDate, tourEndDate, specialRequirements, and provider calendar multi-day span. Triggers: explain/show + booking + pax|tour dates|special requirements|calendar span. Optional bookingId or customerName. NOT explain_tour_services (catalog/upcoming list), NOT explain_tour_calendar_span (general calendar UI mechanics), NOT list_bookings, and NOT explain_booking_policy.
- explain_tour_calendar_span: READ — explain vert-tour-1.10 provider calendar rendering: multi-day spans, service colors, clipped weeks, stacked departure lanes. Triggers: explain/how/why + provider calendar + span|colors|clipped|stacked lanes. Optional serviceName or weekStartDate. NOT explain_tour_booking_record (one booking metadata), NOT list_tour_calendar_week, NOT list_upcoming_tour_departures, and NOT explain_tour_services.
- list_tour_calendar_week: READ — summarize confirmed tour departures visible on a provider calendar week (dates, pax, service). Triggers: list/show/summarize + calendar week|this week + tour departures on provider calendar. Optional employeeName, serviceName, weekStartDate. NOT explain_tour_calendar_span, NOT list_upcoming_tour_departures, NOT show_appointments, and NOT explain_tour_services.
- list_upcoming_tour_departures: READ — summarize confirmed tour bookings grouped by departure date with booked pax and remaining capacity. Triggers: list/summarize upcoming departures, departure schedule, seats left. Optional serviceName and daysAhead. NOT explain_tour_services (catalog metadata), NOT explain_tour_calendar_span, NOT list_tour_calendar_week, NOT list_bookings, and NOT explain_tour_day_slots.
- apply_tour_playbook: MUTATE — shortcut for tour_operator tenants to seed the tour vertical playbook (Day/Multi-Day/Private tour catalog + Tour operating hours 08:00–18:00 schedule template). Triggers: apply/set up/seed/load + tour playbook|tour operator starter|tour vertical. Requires businessType=tour_operator and at least one employee. NOT bulk_create_catalog (ad-hoc category), NOT apply_schedule (named template for one provider), and NOT configure_tour_service (single service metadata).
- Examples:
  - "Mark City Tour as a tour with max 12 people" → configure_tour_service, serviceName=City Tour, enableTour=true, maxGroupSize=12
  - "Set difficulty to moderate for the mountain trek" → configure_tour_service, serviceName=mountain trek, difficulty=moderate
  - "List tour services with group sizes and cover images" → explain_tour_services
  - "Show upcoming tour bookings with pax and departure dates" → explain_tour_services
  - "Apply tour playbook" → apply_tour_playbook
  - "Set up tour operator starter catalog and 8-18 schedule" → apply_tour_playbook`;

export const APPLY_TOUR_PLAYBOOK_PROMPTS = [
  { id: 'apply-tour-playbook', prompt: 'Apply tour playbook' },
  {
    id: 'setup-tour-operator-starter',
    prompt: 'Set up tour operator starter catalog and schedule',
  },
  {
    id: 'load-tour-vertical',
    prompt: 'Load the tour vertical playbook for our business',
  },
  {
    id: 'seed-tour-catalog-schedule',
    prompt: 'Seed tour catalog and 08:00–18:00 operating hours schedule',
  },
  {
    id: 'run-tour-playbook',
    prompt: 'Run the tour playbook to add sample tours and hours',
  },
  {
    id: 'install-tour-starter',
    prompt: 'Install tour operator starter services and schedule template',
  },
  {
    id: 'use-tour-vertical-playbook',
    prompt: 'Use the tour vertical playbook for onboarding',
  },
  {
    id: 'apply-tour-catalog-hours',
    prompt: 'Apply tour playbook with catalog and tour operating hours',
  },
  {
    id: 'setup-tour-business',
    prompt: 'Set up our tour business with the default tour playbook',
  },
  {
    id: 'seed-tour-operator-playbook',
    prompt: 'Seed the tour operator playbook — catalog plus 8 to 18 schedule',
  },
  {
    id: 'load-starter-tours',
    prompt: 'Load starter tour services and weekly operating schedule',
  },
  {
    id: 'apply-vertical-tour-playbook',
    prompt: 'Apply vertical tour playbook for tour operator',
  },
] as const;

export const EXPLAIN_TOUR_SERVICES_PROMPTS = [
  {
    id: 'list-tour-services',
    prompt: 'List tour services with group sizes and cover images',
  },
  {
    id: 'upcoming-tour-bookings',
    prompt: 'Show upcoming tour bookings for the mountain trek',
    serviceName: 'mountain trek',
  },
  {
    id: 'explain-tours-overview',
    prompt: 'Explain our tour services and upcoming departures',
  },
  {
    id: 'what-tours-offered',
    prompt: 'What tours do we offer?',
  },
  {
    id: 'tour-group-sizes',
    prompt: 'Which tour services have max group sizes configured?',
  },
  {
    id: 'tour-cover-images',
    prompt: 'Show cover images for our tour catalog services',
  },
  {
    id: 'meeting-points-tours',
    prompt: 'Which tour services have a meeting point configured?',
  },
  {
    id: 'city-tour-details',
    prompt: 'Explain tour settings for City Tour',
    serviceName: 'City Tour',
  },
  {
    id: 'mountain-trek-bookings',
    prompt: 'What upcoming bookings does the mountain trek have?',
    serviceName: 'mountain trek',
  },
  {
    id: 'tour-catalog-difficulty',
    prompt: 'Which tour services have difficulty configured?',
  },
  {
    id: 'catalog-and-schedule',
    prompt: "Show our tour catalog and who's booked on upcoming departures",
  },
  {
    id: 'max-group-city-tour',
    prompt: 'What is the max group size for Full Day City Tour?',
    serviceName: 'Full Day City Tour',
  },
] as const;

export const CONFIGURE_TOUR_SERVICE_PROMPTS = [
  {
    id: 'mark-city-tour-max-12',
    prompt: 'Mark City Tour as a tour with max 12 people',
    serviceName: 'City Tour',
    enableTour: true,
    maxGroupSize: 12,
  },
  {
    id: 'set-difficulty-mountain-trek',
    prompt: 'Set difficulty to moderate for the mountain trek',
    serviceName: 'mountain trek',
    difficulty: 'moderate' as const,
  },
  {
    id: 'max-group-city-tour',
    prompt: 'Set max group size for Full Day City Tour to 15',
    serviceName: 'Full Day City Tour',
    maxGroupSize: 15,
  },
  {
    id: 'enable-sunset-coastal',
    prompt: 'Make Sunset Coastal Drive a tour with 10 person cap',
    serviceName: 'Sunset Coastal Drive',
    enableTour: true,
    maxGroupSize: 10,
  },
  {
    id: 'difficulty-heritage-easy',
    prompt: 'Change difficulty on Weekend Heritage Tour to easy',
    serviceName: 'Weekend Heritage Tour',
    difficulty: 'easy' as const,
  },
  {
    id: 'challenging-mountain-trek',
    prompt: 'Set the 3-Day Mountain Trek difficulty to challenging',
    serviceName: '3-Day Mountain Trek',
    difficulty: 'challenging' as const,
  },
  {
    id: 'meeting-point-city-tour',
    prompt: 'Set meeting point for City Tour to Main hotel lobby',
    serviceName: 'City Tour',
    meetingPoint: 'Main hotel lobby',
  },
  {
    id: 'duration-days-mountain',
    prompt: 'Set duration days to 3 for the mountain trek',
    serviceName: 'mountain trek',
    durationDays: 3,
  },
  {
    id: 'max-8-mountain-trek',
    prompt: 'Update max group size on 3-Day Mountain Trek to 8 guests',
    serviceName: '3-Day Mountain Trek',
    maxGroupSize: 8,
  },
  {
    id: 'enable-heritage-tour',
    prompt: 'Enable tour mode for Weekend Heritage Tour',
    serviceName: 'Weekend Heritage Tour',
    enableTour: true,
  },
  {
    id: 'included-items-city',
    prompt:
      'Set included items for Full Day City Tour to Transport, guide, lunch',
    serviceName: 'Full Day City Tour',
    includedItems: 'Transport, guide, lunch',
  },
  {
    id: 'cover-image-sunset',
    prompt:
      'Set cover image for Sunset Coastal Drive to /placeholders/tours/coastal.jpg',
    serviceName: 'Sunset Coastal Drive',
    coverImage: '/placeholders/tours/coastal.jpg',
  },
] as const;
