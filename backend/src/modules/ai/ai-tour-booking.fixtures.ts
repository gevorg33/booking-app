/** Customer/public classifier rules for tour booking page details (ai-cmd-tour-5). */
export const TOUR_BOOKING_CLASSIFIER_RULES = `- explain_tour_booking: READ — explain one tour catalog service's booking-page details: max group size, per-person unit price (total multiplies by pax at checkout), and duration (days or hours badge). Triggers on the booking page or consumer app when the visitor asks about group size, per-person pricing, or how long a named tour runs. Optional serviceName filter. NOT diagnose_tour_capacity (checkout rejection for pax/date), NOT explain_tour_day_slots (one departure per day / remainingSpots / fully booked date), NOT explain_tour_services (dashboard admin tour list and upcoming departures), NOT list_services (whole catalog), NOT explain_checkout_currency (salon-wide currency display), and NOT configure_tour_service (admin mutate).
- Examples:
  - "What is the max group size for City Tour on this booking page?" → explain_tour_booking, serviceName=City Tour
  - "Is the Mountain Trek priced per person?" → explain_tour_booking, serviceName=Mountain Trek
  - "How many days does the Wine Country tour run?" → explain_tour_booking, serviceName=Wine Country
  - "How long is the Sunset Hike here?" → explain_tour_booking, serviceName=Sunset Hike
  - "Почему цена City Tour указана за человека на странице записи?" → explain_tour_booking, serviceName=City Tour
  - "Քանի հոգի կարող է մասնակցել Garni Temple տուրին այս էջում" → explain_tour_booking, serviceName=Garni Temple
  - "What's the per-person price for City Tour when I book?" → explain_tour_booking, serviceName=City Tour`;

export const EXPLAIN_TOUR_BOOKING_PROMPTS = [
  {
    id: 'public-max-group-city-tour',
    prompt: 'What is the max group size for City Tour on this booking page?',
    serviceName: 'City Tour',
    aspect: 'groupSize' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-per-person-mountain-trek',
    prompt: 'Is the Mountain Trek priced per person?',
    serviceName: 'Mountain Trek',
    aspect: 'pricing' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-days-wine-country',
    prompt: 'How many days does the Wine Country tour run?',
    serviceName: 'Wine Country',
    aspect: 'duration' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-how-long-sunset-hike',
    prompt: 'How long is the Sunset Hike here?',
    serviceName: 'Sunset Hike',
    aspect: 'duration' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-group-and-duration-garni',
    prompt:
      'On this page, what group size and duration does the Garni Temple tour have?',
    serviceName: 'Garni Temple',
    aspect: 'all' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-how-many-people-full-day',
    prompt: 'How many people can book the Full Day City Tour?',
    serviceName: 'Full Day City Tour',
    aspect: 'groupSize' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-ru-max-group-city-tour',
    prompt:
      'Какой максимальный размер группы у City Tour на странице записи?',
    serviceName: 'City Tour',
    aspect: 'groupSize' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-ru-days-mountain-trek',
    prompt: 'Сколько дней длится Mountain Trek?',
    serviceName: 'Mountain Trek',
    aspect: 'duration' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-hy-max-group-garni',
    prompt: 'Քանի հոգի կարող է մասնակցել Garni Temple տուրին այս էջում',
    serviceName: 'Garni Temple',
    aspect: 'groupSize' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-hy-days-wine-country',
    prompt: 'Քանի օր է տևում Wine Country տուրը գրանցման էջում',
    serviceName: 'Wine Country',
    aspect: 'duration' as const,
    surface: 'public' as const,
  },
  {
    id: 'customer-per-person-city-tour',
    prompt: "What's the per-person price for City Tour when I book?",
    serviceName: 'City Tour',
    aspect: 'pricing' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-duration-garni-booking-page',
    prompt: 'How long is the Garni Temple tour on the booking page?',
    serviceName: 'Garni Temple',
    aspect: 'duration' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-max-group-mountain-trek',
    prompt: 'Max group size for Mountain Trek — can I bring 10 people?',
    serviceName: 'Mountain Trek',
    aspect: 'groupSize' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-multi-day-full-day',
    prompt: 'Is Full Day City Tour a multi-day tour?',
    serviceName: 'Full Day City Tour',
    aspect: 'duration' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-duration-and-cap-sunset',
    prompt: 'Tell me the duration and group cap for Sunset Hike on online booking',
    serviceName: 'Sunset Hike',
    aspect: 'all' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-price-per-person-wine',
    prompt: 'Does Wine Country show a per-person price in the catalog?',
    serviceName: 'Wine Country',
    aspect: 'pricing' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-ru-per-person-city-tour',
    prompt:
      'Почему цена City Tour указана за человека на странице записи?',
    serviceName: 'City Tour',
    aspect: 'pricing' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-ru-group-mountain-trek',
    prompt: 'Сколько человек максимум в группе Mountain Trek?',
    serviceName: 'Mountain Trek',
    aspect: 'groupSize' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-hy-per-person-garni',
    prompt: 'Garni Temple-ի գինը մեկ անձի համար է ցուցադրվում',
    serviceName: 'Garni Temple',
    aspect: 'pricing' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-hy-duration-sunset',
    prompt: 'Sunset Hike-ը քանի ժամ է տևում գրանցման էջում',
    serviceName: 'Sunset Hike',
    aspect: 'duration' as const,
    surface: 'customer' as const,
  },
] as const;
