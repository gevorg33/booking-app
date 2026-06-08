import type { ClassificationSurface } from './ai-classification-engine.types.js';

/** n99-2.4 — rare phrasing prompts should retrieve similar labeled classify examples. */
export interface N99FewShotRetrievalScenario {
  id: string;
  surface: ClassificationSurface;
  prompt: string;
  expectedAction: string;
  rarePhrasing?: boolean;
  minCount?: number;
}

export const N99_FEWSHOT_RETRIEVAL_SCENARIOS: N99FewShotRetrievalScenario[] = [
  {
    id: 'dashboard-en-register-maria',
    surface: 'dashboard',
    prompt: 'Register Maria for facemassage tomorrow at two pm',
    expectedAction: 'create_booking',
    rarePhrasing: true,
  },
  {
    id: 'dashboard-en-slot-in-maria',
    surface: 'dashboard',
    prompt: 'Slot Maria in for a facemassage tomorrow at 2 in the afternoon',
    expectedAction: 'create_booking',
    rarePhrasing: true,
  },
  {
    id: 'dashboard-en-put-on-books',
    surface: 'dashboard',
    prompt: 'Put Maria on the books for facemassage tomorrow at 14:00',
    expectedAction: 'create_booking',
    rarePhrasing: true,
  },
  {
    id: 'dashboard-en-stylists-openings',
    surface: 'dashboard',
    prompt: 'Which stylists have openings tomorrow evening for lashes',
    expectedAction: 'check_providers_for_service',
    rarePhrasing: true,
  },
  {
    id: 'dashboard-en-find-providers-availability',
    surface: 'dashboard',
    prompt: 'Find providers with availability tomorrow for lash service',
    expectedAction: 'check_providers_for_service',
    rarePhrasing: true,
  },
  {
    id: 'dashboard-hy-plan-maria',
    surface: 'dashboard',
    prompt: 'Պլանավորիր Maria-ի facemassage պատվերը վաղը ժամը 14:00',
    expectedAction: 'create_booking',
    rarePhrasing: true,
  },
  {
    id: 'dashboard-ru-oformi-zapis',
    surface: 'dashboard',
    prompt: 'Оформи запись Maria на facemassage завтра днем в 14:00',
    expectedAction: 'create_booking',
    rarePhrasing: true,
  },
  {
    id: 'customer-en-grab-soonest',
    surface: 'customer',
    prompt: 'Grab the soonest opening for massage tomorrow evening',
    expectedAction: 'book_nearest_slot',
    rarePhrasing: true,
  },
  {
    id: 'customer-en-earliest-slot',
    surface: 'customer',
    prompt: 'Reserve the earliest massage slot tomorrow evening',
    expectedAction: 'book_nearest_slot',
    rarePhrasing: true,
  },
  {
    id: 'customer-hy-first-open',
    surface: 'customer',
    prompt: 'Վերցրու massage-ի առաջին ազատ slot-ը վաղը երեկոյան',
    expectedAction: 'book_nearest_slot',
    rarePhrasing: true,
  },
  {
    id: 'public-en-soonest-appointment',
    surface: 'public',
    prompt: 'Book the soonest appointment for massage tomorrow evening',
    expectedAction: 'book_appointment',
    rarePhrasing: true,
  },
  {
    id: 'public-en-hold-first-opening',
    surface: 'public',
    prompt: 'Hold the first available lashes opening tomorrow night',
    expectedAction: 'book_appointment',
    rarePhrasing: true,
  },
  {
    id: 'provider-en-record-payment',
    surface: 'provider',
    prompt: 'Record payment for this visit',
    expectedAction: 'mark_paid',
    rarePhrasing: true,
  },
  {
    id: 'provider-en-list-my-day',
    surface: 'provider',
    prompt: 'Show me everything on my schedule tomorrow',
    expectedAction: 'show_appointments',
    rarePhrasing: true,
  },
];
