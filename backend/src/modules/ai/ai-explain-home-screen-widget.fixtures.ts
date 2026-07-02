export type ExplainHomeScreenWidgetAspect =
  | 'add_to_home_screen'
  | 'what_shows'
  | 'next_appointment'
  | 'quick_rebook'
  | 'signed_out_state'
  | 'how_it_works';

export type ExplainHomeScreenWidgetFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_home_screen_widget';
  rescueReason: 'home_screen_widget';
  aspect?: ExplainHomeScreenWidgetAspect;
};

export const CUSTOMER_EXPLAIN_HOME_SCREEN_WIDGET_CLASSIFIER_RULES = `- explain_home_screen_widget: READ — customer asks about the consumer home-screen widget (widgetNextAppointment* / widgetQuickRebook*): how to add it, what it shows, next appointment tile, or quick rebook from the widget. Triggers: add next appointment to home screen, what does the widget show, home screen widget, widget quick rebook. NOT rebook_last_appointment (in-app mutate rebook), NOT Zendesk/support chat widget, NOT provider app widgets.`;

export const EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS: readonly ExplainHomeScreenWidgetFixture[] =
  [
    {
      id: 'add-to-home-screen-customer',
      prompt: 'Add next appointment to home screen',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'add_to_home_screen',
    },
    {
      id: 'what-widget-shows-customer',
      prompt: 'What does the widget show?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'what_shows',
    },
    {
      id: 'how-add-widget-customer',
      prompt: 'How do I add the OptiSchedule widget?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'add_to_home_screen',
    },
    {
      id: 'next-appointment-widget-customer',
      prompt: 'What is the next appointment section on the widget?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'next_appointment',
    },
    {
      id: 'widget-quick-rebook-customer',
      prompt: 'What does Book again on the widget do?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'quick_rebook',
    },
    {
      id: 'home-screen-widget-customer',
      prompt: 'How does the home screen widget work?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'how_it_works',
    },
    {
      id: 'widget-signed-out-customer',
      prompt: 'Why does the widget say sign in?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'signed_out_state',
    },
    {
      id: 'widget-tap-opens-customer',
      prompt: 'What happens when I tap the widget?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'what_shows',
    },
    {
      id: 'android-widget-customer',
      prompt: 'How do I add the widget on Android?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'add_to_home_screen',
    },
    {
      id: 'ios-widget-customer',
      prompt: 'How do I add the widget on iPhone?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'add_to_home_screen',
    },
    {
      id: 'widget-updates-customer',
      prompt: 'When does the home screen widget update?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'how_it_works',
    },
    {
      id: 'widget-empty-customer',
      prompt: 'Why is my widget empty?',
      surface: 'customer',
      expectedAction: 'explain_home_screen_widget',
      rescueReason: 'home_screen_widget',
      aspect: 'what_shows',
    },
  ];

export const EXPLAIN_HOME_SCREEN_WIDGET_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-unknown',
    prompt: 'Add next appointment to home screen',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_home_screen_widget' as const,
  },
  {
    id: 'misclassified-rebook',
    prompt: 'What does the widget show?',
    misclassifiedAction: 'rebook_last_appointment',
    expectedAction: 'explain_home_screen_widget' as const,
  },
  {
    id: 'misclassified-product-guide',
    prompt: 'How do I add the OptiSchedule widget?',
    misclassifiedAction: 'product_guide',
    expectedAction: 'explain_home_screen_widget' as const,
  },
] as const;

export const EXPLAIN_HOME_SCREEN_WIDGET_BOUNDARY_PROMPTS = [
  {
    id: 'rebook-last',
    prompt: 'Rebook my last appointment',
    surface: 'customer' as const,
  },
  {
    id: 'zendesk-widget',
    prompt: 'Open the support chat widget',
    surface: 'customer' as const,
  },
  {
    id: 'provider-widget',
    prompt: 'Add provider schedule widget to home screen',
    surface: 'provider' as const,
  },
] as const;
