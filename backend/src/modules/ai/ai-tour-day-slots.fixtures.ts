/** Customer/public classifier rules for tour day-level slot display (ai-cmd-tour-6). */
export const TOUR_DAY_SLOTS_CLASSIFIER_RULES = `- explain_tour_day_slots: READ — explain how multi-day / day-level tours show departures on the booking page: one departure per calendar day (earliest bookable guide slot), remainingSpots for a departure date, and when a date is fully booked (remainingSpots=0 hides all times). Optional serviceName and date. NOT diagnose_tour_capacity (checkout rejected pax or date with error message), NOT explain_tour_booking (catalog max group / per-person price / tour duration), NOT check_availability (who is free), NOT list_services (whole catalog), and NOT explain_tour_services (dashboard admin tour list).
- Examples:
  - "Why does the 3-Day Mountain Trek only show one departure per day?" → explain_tour_day_slots, serviceName=3-Day Mountain Trek
  - "How many spots are left on 15/08/2026 for Mountain Trek?" → explain_tour_day_slots, serviceName=Mountain Trek, date=15/08/2026
  - "Why is August 15 fully booked for the mountain trek?" → explain_tour_day_slots, serviceName=mountain trek, date=15/08/2026
  - "What does remaining spots mean on this tour booking page?" → explain_tour_day_slots
  - "Почему на странице записи у Mountain Trek только одно время в день?" → explain_tour_day_slots, serviceName=Mountain Trek
  - "Քանի տեղ է մնացել 15/08/2026-ին Mountain Trek-ի համար" → explain_tour_day_slots, serviceName=Mountain Trek, date=15/08/2026
  - "Why does Mountain Trek show only one departure time per day when I book?" → explain_tour_day_slots, serviceName=Mountain Trek`;

export const EXPLAIN_TOUR_DAY_SLOTS_PROMPTS = [
  {
    id: 'public-one-departure-mountain-trek',
    prompt: 'Why does the 3-Day Mountain Trek only show one departure per day?',
    serviceName: '3-Day Mountain Trek',
    aspect: 'oneDeparture' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-remaining-spots-date',
    prompt:
      'How many spots are left on 15/08/2026 for the 3-Day Mountain Trek?',
    serviceName: '3-Day Mountain Trek',
    date: '2026-08-15',
    aspect: 'remainingSpots' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-fully-booked-aug-15',
    prompt: 'Why is 15/08/2026 fully booked for the mountain trek?',
    serviceName: '3-Day Mountain Trek',
    date: '2026-08-15',
    aspect: 'fullyBooked' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-remaining-spots-meaning',
    prompt: 'What does remaining spots mean on this tour booking page?',
    aspect: 'remainingSpots' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-why-one-time-slot',
    prompt:
      'On this booking page, why do I only see one time slot for multi-day tours?',
    aspect: 'oneDeparture' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-no-slots-date',
    prompt:
      'Why are there no departure times for Mountain Trek on 15/08/2026?',
    serviceName: '3-Day Mountain Trek',
    date: '2026-08-15',
    aspect: 'fullyBooked' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-day-level-booking',
    prompt: 'Explain day-level booking for the 3-Day Mountain Trek here',
    serviceName: '3-Day Mountain Trek',
    aspect: 'oneDeparture' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-ru-one-time-per-day',
    prompt:
      'Почему на странице записи у Mountain Trek только одно время в день?',
    serviceName: '3-Day Mountain Trek',
    aspect: 'oneDeparture' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-ru-spots-left',
    prompt: 'Сколько мест осталось на 15/08/2026 для Mountain Trek?',
    serviceName: '3-Day Mountain Trek',
    date: '2026-08-15',
    aspect: 'remainingSpots' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-hy-spots-left',
    prompt: 'Քանի տեղ է մնացել 15/08/2026-ին Mountain Trek-ի համար',
    serviceName: '3-Day Mountain Trek',
    date: '2026-08-15',
    aspect: 'remainingSpots' as const,
    surface: 'public' as const,
  },
  {
    id: 'customer-one-departure',
    prompt:
      'Why does Mountain Trek show only one departure time per day when I book?',
    serviceName: '3-Day Mountain Trek',
    aspect: 'oneDeparture' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-spots-left-online',
    prompt:
      'How many spots are left on 15/08/2026 for Mountain Trek on online booking?',
    serviceName: '3-Day Mountain Trek',
    date: '2026-08-15',
    aspect: 'remainingSpots' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-fully-booked',
    prompt: 'Is 15/08/2026 sold out for the 3-Day Mountain Trek?',
    serviceName: '3-Day Mountain Trek',
    date: '2026-08-15',
    aspect: 'fullyBooked' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-remaining-spots-label',
    prompt: 'What does "spots left" mean for tour dates on the booking page?',
    aspect: 'remainingSpots' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-why-no-times',
    prompt:
      'Why are no times shown for Mountain Trek on August 15 on the booking page?',
    serviceName: '3-Day Mountain Trek',
    date: '2026-08-15',
    aspect: 'fullyBooked' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-day-level-multi-day',
    prompt:
      'Explain why multi-day tours collapse to one slot per day on the catalog',
    aspect: 'oneDeparture' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-ru-one-departure',
    prompt:
      'Почему многодневный Mountain Trek показывает одно время в день?',
    serviceName: '3-Day Mountain Trek',
    aspect: 'oneDeparture' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-ru-fully-booked',
    prompt: 'Почему 15/08/2026 недоступен для Mountain Trek?',
    serviceName: '3-Day Mountain Trek',
    date: '2026-08-15',
    aspect: 'fullyBooked' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-hy-one-departure',
    prompt:
      'Ինչու է Mountain Trek-ը մեկ մեկնում ցույց տալիս օրական',
    serviceName: '3-Day Mountain Trek',
    aspect: 'oneDeparture' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-hy-fully-booked',
    prompt: 'Ինչու է 15/08/2026-ը ամբողջությամբ ամրագրված Mountain Trek-ի համար',
    serviceName: '3-Day Mountain Trek',
    date: '2026-08-15',
    aspect: 'fullyBooked' as const,
    surface: 'customer' as const,
  },
] as const;
