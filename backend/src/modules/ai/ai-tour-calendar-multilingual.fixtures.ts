import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type TourCalendarEvalAction =
  | 'explain_tour_calendar_span'
  | 'list_tour_calendar_week';

export interface TourCalendarEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: TourCalendarEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Classifier guidance for Armenian/Russian tour calendar span + week list phrasing (ai-cmd-tour-13). */
export const TOUR_CALENDAR_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian provider tour calendar (dashboard vert-tour-1.10):
  - explain_tour_calendar_span: hy «ինչու է տուրը մի քանի օր ցուցադրվում օրացույցում», «տարբեր գույն յուրաքանչյուր էքսկուրսիայի», «կտրվում շաբաթվա սահմաններում», «կուտակված տողերում օրացույցում», «բացատրիր span-ը պրովայդերի օրացույցում»; ru «почему тур на несколько дней на календаре провайдера», «свой цвет на календаре провайдера», «обрезается на границе недели», «отдельные полосы на календаре», «объясни span туров на календаре». READ how multi-day spans, service colors, clipped weeks, and stacked lanes render — NOT list_tour_calendar_week (summarize departures this week) and NOT explain_tour_booking_record (one booking metadata).
  - list_tour_calendar_week: hy «ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում pax-ով», «Maria-ի օրացույցի այս շաբաթվա էքսկուրսիաները», «Gevorg-ի պրովայդերի օրացույցում այս շաբաթ», «շաբաթ 2026-06-09 մեկնումներ», «mountain trek այս օրացույցային շաբաթում»; ru «покажи туры на календаре провайдера на этой неделе», «экскурсии на календаре Maria на этой неделе», «туры на календаре Gevorg на этой неделе», «неделя 2026-06-09 выезды», «туры mountain trek на календарной неделе». READ tour departures visible on the provider calendar week (dates, pax, service) — NOT explain_tour_calendar_span (how UI renders) and NOT list_upcoming_tour_departures (next N days + remaining capacity).`;

export const MULTILINGUAL_TOUR_CALENDAR_EVAL_SCENARIOS: TourCalendarEvalScenario[] =
  [
    {
      id: 'hy-span-multi-day',
      locale: 'hy',
      prompt:
        'Ինչու է տուրը մի քանի օր ցուցադրվում պրովայդերի օրացույցում',
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      paramsPartial: { aspect: 'multiDaySpan' },
      needsMultilingual: true,
    },
    {
      id: 'hy-span-service-colors',
      locale: 'hy',
      prompt:
        'Ինչու է յուրաքանչյուր էքսկուրսիա ունենում տարբեր գույն օրացույցում',
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      paramsPartial: { aspect: 'serviceColors' },
      needsMultilingual: true,
    },
    {
      id: 'hy-span-clipped-week',
      locale: 'hy',
      prompt:
        'Ինչու է մի քանի օրյա տուրը կտրվում շաբաթվա սահմաններում օրացույցում',
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      paramsPartial: { aspect: 'clippedWeek' },
      needsMultilingual: true,
    },
    {
      id: 'hy-span-stacked-lanes',
      locale: 'hy',
      prompt: 'Ինչու են տուրերը կուտակված տողերում օրացույցում',
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      paramsPartial: { aspect: 'stackedDepartures' },
      needsMultilingual: true,
    },
    {
      id: 'hy-span-provider-mechanics',
      locale: 'hy',
      prompt:
        'Բացատրիր ինչպես է պրովայդերի օրացույցը ցույց տալիս տուրերի span-երը',
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      paramsPartial: { aspect: 'all' },
      needsMultilingual: true,
    },
    {
      id: 'hy-span-mountain-trek',
      locale: 'hy',
      prompt:
        'Բացատրիր 3-Day Mountain Trek-ի span-ը պրովայդերի օրացույցում',
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      paramsPartial: {
        serviceName: '3-Day Mountain Trek',
        aspect: 'multiDaySpan',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-week-this-week-pax',
      locale: 'hy',
      prompt: 'Ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում pax-ով',
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      needsMultilingual: true,
    },
    {
      id: 'hy-week-maria',
      locale: 'hy',
      prompt:
        'Ցուցադրիր Maria-ի օրացույցի այս շաբաթվա էքսկուրսիաները pax-ով',
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      paramsPartial: { employeeName: 'Maria' },
      needsMultilingual: true,
    },
    {
      id: 'hy-week-gevorg',
      locale: 'hy',
      prompt:
        'Gevorg-ի պրովայդերի օրացույցում այս շաբաթ որ էքսկուրսիաներ են',
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      paramsPartial: { employeeName: 'Gevorg' },
      needsMultilingual: true,
    },
    {
      id: 'hy-week-of-date',
      locale: 'hy',
      prompt:
        '2026-06-09 շաբաթ — էքսկուրսիաների մեկնումներ պրովայդերի օրացույցում',
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      paramsPartial: { weekStartDate: '2026-06-09' },
      needsMultilingual: true,
    },
    {
      id: 'hy-week-mountain-trek',
      locale: 'hy',
      prompt: 'Mountain trek էքսկուրսիաներ այս օրացույցային շաբաթում pax-ով',
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      paramsPartial: { serviceName: 'Mountain trek' },
      needsMultilingual: true,
    },
    {
      id: 'hy-week-visible-tours',
      locale: 'hy',
      prompt: 'Որ տուրեր են երևում այս շաբաթ օրացույցում pax-ով',
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      needsMultilingual: true,
    },
    {
      id: 'ru-span-multi-day',
      locale: 'ru',
      prompt:
        'Почему тур отображается на несколько дней на календаре провайдера',
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      paramsPartial: { aspect: 'multiDaySpan' },
      needsMultilingual: true,
    },
    {
      id: 'ru-span-service-colors',
      locale: 'ru',
      prompt: 'Почему у каждого тура свой цвет на календаре провайдера',
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      paramsPartial: { aspect: 'serviceColors' },
      needsMultilingual: true,
    },
    {
      id: 'ru-span-clipped-week',
      locale: 'ru',
      prompt:
        'Почему многодневный тур обрезается на границе недели на календаре',
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      paramsPartial: { aspect: 'clippedWeek' },
      needsMultilingual: true,
    },
    {
      id: 'ru-span-stacked-lanes',
      locale: 'ru',
      prompt: 'Почему туры выстраиваются в отдельные полосы на календаре',
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      paramsPartial: { aspect: 'stackedDepartures' },
      needsMultilingual: true,
    },
    {
      id: 'ru-span-provider-mechanics',
      locale: 'ru',
      prompt: 'Объясни как календарь провайдера показывает span туров',
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      paramsPartial: { aspect: 'all' },
      needsMultilingual: true,
    },
    {
      id: 'ru-span-mountain-trek',
      locale: 'ru',
      prompt: 'Объясни span 3-Day Mountain Trek на календаре провайдера',
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      paramsPartial: {
        serviceName: '3-Day Mountain Trek',
        aspect: 'multiDaySpan',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-week-this-week-pax',
      locale: 'ru',
      prompt: 'Покажи туры на календаре провайдера на этой неделе с pax',
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      needsMultilingual: true,
    },
    {
      id: 'ru-week-maria',
      locale: 'ru',
      prompt: 'Покажи экскурсии на календаре Maria на этой неделе с pax',
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      paramsPartial: { employeeName: 'Maria' },
      needsMultilingual: true,
    },
    {
      id: 'ru-week-gevorg',
      locale: 'ru',
      prompt: 'Какие туры на календаре Gevorg на этой неделе',
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      paramsPartial: { employeeName: 'Gevorg' },
      needsMultilingual: true,
    },
    {
      id: 'ru-week-of-date',
      locale: 'ru',
      prompt: 'Неделя 2026-06-09 — выезды туров на календаре провайдера',
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      paramsPartial: { weekStartDate: '2026-06-09' },
      needsMultilingual: true,
    },
    {
      id: 'ru-week-mountain-trek',
      locale: 'ru',
      prompt: 'Туры mountain trek на этой календарной неделе с pax',
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      paramsPartial: { serviceName: 'mountain trek' },
      needsMultilingual: true,
    },
    {
      id: 'ru-week-visible-tours',
      locale: 'ru',
      prompt:
        'Какие туры видны на календаре провайдера на этой неделе с pax',
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      needsMultilingual: true,
    },
  ] as const;
