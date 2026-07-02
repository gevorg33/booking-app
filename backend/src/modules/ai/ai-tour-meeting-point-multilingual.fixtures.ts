import type { ExplainTourMeetingPointPromptFixture } from './ai-tour-meeting-point.fixtures.js';

export const EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_CLASSIFIER_RULES = `- explain_tour_meeting_point HY/RU: hy «որտեղ ենք հանդիպում», «ժամը քանի՞ն է պետք է հասնեմ», «հանդիպման կետ»; ru «где встречаемся», «во сколько приехать», «точка встречи», «время отправления». READ tour meetingPoint + booked arrival time — NOT explain_preparation_notes (clinic prep) and NOT get_directions_to_salon.`;

export type ExplainTourMeetingPointMultilingualScenario =
  ExplainTourMeetingPointPromptFixture & {
    locale: 'hy' | 'ru';
  };

export const EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_SCENARIOS: readonly ExplainTourMeetingPointMultilingualScenario[] =
  [
    {
      id: 'meeting-hy-customer',
      locale: 'hy',
      prompt: 'Որտեղ ենք հանդիպում իմ տուրի համար',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
    },
    {
      id: 'arrival-hy-customer',
      locale: 'hy',
      prompt: 'ժամը քանի՞ն է պետք է հասնեմ Mountain Trek-ի համար',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'arrival_time',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'Mountain Trek',
    },
    {
      id: 'meeting-hy-public',
      locale: 'hy',
      prompt: 'Ցույց տուր Wine Country տուրի հանդիպման կետը գրանցման էջում',
      surface: 'public',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'Wine Country',
    },
    {
      id: 'meeting-ru-customer',
      locale: 'ru',
      prompt: 'Где встречаемся для моего тура?',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
    },
    {
      id: 'arrival-ru-customer',
      locale: 'ru',
      prompt: 'Во сколько нужно приехать на Mountain Trek?',
      surface: 'customer',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'arrival_time',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'Mountain Trek',
    },
    {
      id: 'meeting-ru-public',
      locale: 'ru',
      prompt: 'Где точка встречи для Wine Country тура на странице записи?',
      surface: 'public',
      expectedAction: 'explain_tour_meeting_point',
      aspect: 'meeting_point',
      rescueReason: 'explain_tour_meeting_point',
      serviceName: 'Wine Country',
    },
  ];
