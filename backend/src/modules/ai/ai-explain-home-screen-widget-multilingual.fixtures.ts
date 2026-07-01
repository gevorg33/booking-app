import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ExplainHomeScreenWidgetAspect } from './ai-explain-home-screen-widget.fixtures.js';

export type ExplainHomeScreenWidgetMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_home_screen_widget';
  rescueReason: 'home_screen_widget';
  aspect?: ExplainHomeScreenWidgetAspect;
};

export const EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian explain home screen widget (customer mobile):
  - explain_home_screen_widget: hy «Ավելացնել հաջորդ հանդիպումը հիմնական էկրանին», «Ինչ է ցույց տալիս վիջեթը»; ru «Добавить следующую запись на главный экран», «Что показывает виджет». READ widgetNextAppointment — NOT rebook_last_appointment.`;

export const EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_SCENARIOS: readonly ExplainHomeScreenWidgetMultilingualScenario[] =
  [
    {
      id: 'add-widget-hy-customer',
      locale: 'hy',
      prompt: 'Ավելացնել հաջորդ հանդիպումը հիմնական էկրանին',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'add_to_home_screen',
    },
    {
      id: 'what-shows-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ է ցույց տալիս վիջեթը',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'what_shows',
    },
    {
      id: 'quick-rebook-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ է անում վիջեթի կրկին ամրագրումը',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'quick_rebook',
    },
    {
      id: 'add-widget-ru-customer',
      locale: 'ru',
      prompt: 'Добавить следующую запись на главный экран',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'add_to_home_screen',
    },
    {
      id: 'what-shows-ru-customer',
      locale: 'ru',
      prompt: 'Что показывает виджет?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'what_shows',
    },
    {
      id: 'how-widget-ru-customer',
      locale: 'ru',
      prompt: 'Как работает виджет на главном экране?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'how_it_works',
    },
  ];
