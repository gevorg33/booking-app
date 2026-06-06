import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type TourServiceEvalAction =
  | 'configure_tour_service'
  | 'explain_tour_services'
  | 'list_upcoming_tour_departures';

export interface TourServiceEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: TourServiceEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Classifier guidance for Armenian/Russian tour configure/explain phrasing (ai-cmd-tour-4). */
export const TOUR_SERVICE_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian tour services (dashboard tour_operator):
  - configure_tour_service: hy «նշի՛ր City Tour-ը որպես էքսկուրսիա 12 հոգու», «դարձրու moderate դժվարություն mountain trek-ի համար», «սահմանի՛ր առավելագույն խումբը 15 հոգի», «ակտիվացրու էքսկուրսիայի ռեժիմը», «փոխի՛ր հանդիպման կետը», «սահմանի՛ր տևողությունը 3 օր»; ru «отметь City Tour как тур на 12 человек», «установи сложность moderate для mountain trek», «максимальный размер группы для Full Day City Tour», «включи тур-режим», «измени точку встречи», «установи длительность 3 дня». MUTATE one catalog service tour metadata — NOT apply_tour_playbook (vertical seed) and NOT explain_tour_services (read list).
  - explain_tour_services: hy «ցույց տուր էքսկուրսիաների ծառայությունները», «ցուցադրիր առաջիկա ամրագրումները pax-ով», «ինչ էքսկուրսիաներ ենք առաջարկում», «որքան է առավելագույն խումբը»; ru «покажи туры с размером группы», «покажи предстоящие туры с pax», «какие туры мы предлагаем», «какой максимальный размер группы». READ tour catalog + upcoming tour bookings — NOT configure_tour_service (mutate) and NOT list_bookings (all appointment types).`;

export const MULTILINGUAL_TOUR_SERVICE_EVAL_SCENARIOS: TourServiceEvalScenario[] =
  [
    {
      id: 'hy-configure-city-tour-max-12',
      locale: 'hy',
      prompt:
        'Նշի՛ր City Tour-ը որպես էքսկուրսիա առավելագույնը 12 հոգու համար',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: {
        serviceName: 'City Tour',
        enableTour: true,
        maxGroupSize: 12,
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-mountain-trek-moderate',
      locale: 'hy',
      prompt: 'Դժվարության աստիճանը դարձրու moderate mountain trek-ի համար',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: { serviceName: 'mountain trek', difficulty: 'moderate' },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-city-tour-max-15',
      locale: 'hy',
      prompt:
        'Սահմանի՛ր Full Day City Tour-ի համար առավելագույն խումբը 15 հոգի',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: { serviceName: 'Full Day City Tour', maxGroupSize: 15 },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-heritage-enable',
      locale: 'hy',
      prompt:
        'Ակտիվացրու՛ էքսկուրսիայի ռեժիմը Weekend Heritage Tour-ի համար',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: { serviceName: 'Weekend Heritage Tour', enableTour: true },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-city-tour-meeting-point',
      locale: 'hy',
      prompt: 'Փոխի՛ր City Tour-ի հանդիպման կետը՝ Main hotel lobby',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: {
        serviceName: 'City Tour',
        meetingPoint: 'Main hotel lobby',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-mountain-trek-duration',
      locale: 'hy',
      prompt: 'Սահմանի՛ր mountain trek-ի տևողությունը 3 օր',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: { serviceName: 'mountain trek', durationDays: 3 },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-mountain-trek-max-8',
      locale: 'hy',
      prompt: 'Թարմացրու՛ 3-Day Mountain Trek-ի առավելագույն խմբը 8 հյուր',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: { serviceName: '3-Day Mountain Trek', maxGroupSize: 8 },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-sunset-coastal',
      locale: 'hy',
      prompt:
        'Դարձրու՛ Sunset Coastal Drive-ը էքսկուրսիա առավելագույնը 10 հոգու',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: {
        serviceName: 'Sunset Coastal Drive',
        enableTour: true,
        maxGroupSize: 10,
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-tour-services',
      locale: 'hy',
      prompt: 'Ցույց տուր էքսկուրսիաների ծառայությունները խմբի չափերով',
      expectedAction: 'explain_tour_services',
      rescueReason: 'explain_tour_services',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-upcoming-bookings',
      locale: 'hy',
      prompt: 'Ցուցադրիր առաջիկա էքսկուրսիայի ամրագրումները pax-ով',
      expectedAction: 'explain_tour_services',
      rescueReason: 'explain_tour_services',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-what-tours',
      locale: 'hy',
      prompt: 'Ինչ էքսկուրսիաներ ենք առաջարկում',
      expectedAction: 'explain_tour_services',
      rescueReason: 'explain_tour_services',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-max-group-city-tour',
      locale: 'hy',
      prompt: 'Full Day City Tour-ի առավելագույն խումբը որքան է',
      expectedAction: 'explain_tour_services',
      rescueReason: 'explain_tour_services',
      paramsPartial: { serviceName: 'Full Day City Tour' },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-city-tour-max-12',
      locale: 'ru',
      prompt: 'Отметь City Tour как тур максимум на 12 человек',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: {
        serviceName: 'City Tour',
        enableTour: true,
        maxGroupSize: 12,
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-mountain-trek-moderate',
      locale: 'ru',
      prompt: 'Установи сложность moderate для mountain trek',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: { serviceName: 'mountain trek', difficulty: 'moderate' },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-city-tour-max-15',
      locale: 'ru',
      prompt:
        'Установи максимальный размер группы для Full Day City Tour на 15 человек',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: { serviceName: 'Full Day City Tour', maxGroupSize: 15 },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-heritage-enable',
      locale: 'ru',
      prompt: 'Включи тур-режим для Weekend Heritage Tour',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: { serviceName: 'Weekend Heritage Tour', enableTour: true },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-city-tour-meeting-point',
      locale: 'ru',
      prompt: 'Измени точку встречи City Tour на Main hotel lobby',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: {
        serviceName: 'City Tour',
        meetingPoint: 'Main hotel lobby',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-mountain-trek-duration',
      locale: 'ru',
      prompt: 'Установи длительность mountain trek 3 дня',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: { serviceName: 'mountain trek', durationDays: 3 },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-mountain-trek-max-8',
      locale: 'ru',
      prompt: 'Обнови максимум группы 3-Day Mountain Trek до 8 гостей',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: { serviceName: '3-Day Mountain Trek', maxGroupSize: 8 },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-sunset-coastal',
      locale: 'ru',
      prompt: 'Сделай Sunset Coastal Drive туром на 10 человек',
      expectedAction: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
      paramsPartial: {
        serviceName: 'Sunset Coastal Drive',
        enableTour: true,
        maxGroupSize: 10,
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-tour-services',
      locale: 'ru',
      prompt: 'Покажи туры с размером группы и обложками',
      expectedAction: 'explain_tour_services',
      rescueReason: 'explain_tour_services',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-upcoming-bookings',
      locale: 'ru',
      prompt: 'Покажи предстоящие туры с pax и датами выезда',
      expectedAction: 'list_upcoming_tour_departures',
      rescueReason: 'list_upcoming_tour_departures',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-what-tours',
      locale: 'ru',
      prompt: 'Какие туры мы предлагаем?',
      expectedAction: 'explain_tour_services',
      rescueReason: 'explain_tour_services',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-max-group-city-tour',
      locale: 'ru',
      prompt: 'Какой максимальный размер группы у Full Day City Tour?',
      expectedAction: 'explain_tour_services',
      rescueReason: 'explain_tour_services',
      paramsPartial: { serviceName: 'Full Day City Tour' },
      needsMultilingual: true,
    },
  ] as const;
