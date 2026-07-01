export type ExplainRtlLayoutAspect =
  | 'why_right_aligned'
  | 'assistant_messages'
  | 'locale_direction'
  | 'logical_css'
  | 'generic'
  | 'all';

export type ExplainRtlLayoutPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_rtl_layout';
  rescueReason: 'explain_rtl_layout';
  aspect?: ExplainRtlLayoutAspect;
};

export const CUSTOMER_PUBLIC_EXPLAIN_RTL_LAYOUT_CLASSIFIER_RULES = `- explain_rtl_layout: READ — customer app or public booking web: explain right-to-left (RTL) layout, why text or chat bubbles appear on the right, and how adoption-a11y.css mirrors assistant messages when document dir=rtl. Triggers: "Why is text on the right?", "Why are chat bubbles flipped?", "What is RTL?". Uses locale and documentDirection/dir from session when present. NOT give_ai_feedback (wrong answer), NOT explain_voice_input (mic help), NOT explain_app_feature (generic screen tour), NOT booking_help.`;

export const EXPLAIN_RTL_LAYOUT_PROMPTS: readonly ExplainRtlLayoutPromptFixture[] =
  [
    {
      id: 'why-text-right-customer',
      prompt: 'Why is text on the right?',
      surface: 'customer',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'why_right_aligned',
    },
    {
      id: 'everything-right-side-customer',
      prompt: 'Why is everything on the right side?',
      surface: 'customer',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'why_right_aligned',
    },
    {
      id: 'layout-backwards-customer',
      prompt: 'Why does the layout look backwards?',
      surface: 'customer',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'assistant_messages',
    },
    {
      id: 'chat-bubbles-flipped-customer',
      prompt: 'Why are chat bubbles flipped?',
      surface: 'customer',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'assistant_messages',
    },
    {
      id: 'what-is-rtl-customer',
      prompt: 'What is RTL?',
      surface: 'customer',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'locale_direction',
    },
    {
      id: 'right-to-left-customer',
      prompt: 'Why is this right to left?',
      surface: 'customer',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'locale_direction',
    },
    {
      id: 'explain-rtl-layout-customer',
      prompt: 'Explain RTL layout',
      surface: 'customer',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'generic',
    },
    {
      id: 'assistant-wrong-side-customer',
      prompt: 'Why is the assistant on the wrong side?',
      surface: 'customer',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'assistant_messages',
    },
    {
      id: 'text-alignment-wrong-customer',
      prompt: 'Text alignment looks wrong',
      surface: 'customer',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'generic',
    },
    {
      id: 'typing-on-right-customer',
      prompt: 'Why is typing on the right?',
      surface: 'customer',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'why_right_aligned',
    },
    {
      id: 'armenian-rtl-customer',
      prompt: 'Is Armenian right to left?',
      surface: 'customer',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'locale_direction',
    },
    {
      id: 'reading-direction-customer',
      prompt: 'Explain the reading direction',
      surface: 'customer',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'locale_direction',
    },
    {
      id: 'why-text-right-public',
      prompt: 'Why is text on the right?',
      surface: 'public',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'why_right_aligned',
    },
    {
      id: 'everything-right-side-public',
      prompt: 'Why is everything on the right side?',
      surface: 'public',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'why_right_aligned',
    },
    {
      id: 'layout-backwards-public',
      prompt: 'Why does the layout look backwards?',
      surface: 'public',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'assistant_messages',
    },
    {
      id: 'chat-bubbles-flipped-public',
      prompt: 'Why are chat bubbles flipped?',
      surface: 'public',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'assistant_messages',
    },
    {
      id: 'what-is-rtl-public',
      prompt: 'What is RTL?',
      surface: 'public',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'locale_direction',
    },
    {
      id: 'right-to-left-public',
      prompt: 'Why is this right to left?',
      surface: 'public',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'locale_direction',
    },
    {
      id: 'explain-rtl-layout-public',
      prompt: 'Explain RTL layout',
      surface: 'public',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'generic',
    },
    {
      id: 'assistant-wrong-side-public',
      prompt: 'Why is the assistant on the wrong side?',
      surface: 'public',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'assistant_messages',
    },
    {
      id: 'text-alignment-wrong-public',
      prompt: 'Text alignment looks wrong',
      surface: 'public',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'generic',
    },
    {
      id: 'typing-on-right-public',
      prompt: 'Why is typing on the right?',
      surface: 'public',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'why_right_aligned',
    },
    {
      id: 'armenian-rtl-public',
      prompt: 'Is Armenian right to left?',
      surface: 'public',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'locale_direction',
    },
    {
      id: 'reading-direction-public',
      prompt: 'Explain the reading direction',
      surface: 'public',
      expectedAction: 'explain_rtl_layout',
      rescueReason: 'explain_rtl_layout',
      aspect: 'locale_direction',
    },
  ] as const;

export const EXPLAIN_RTL_LAYOUT_HANDLER_FIXTURES = [
  {
    id: 'rtl-direction',
    prompt: 'Why is text on the right?',
    aspect: 'why_right_aligned',
    params: { locale: 'ar', documentDirection: 'rtl' },
  },
  {
    id: 'ltr-locale',
    prompt: 'Is Armenian right to left?',
    aspect: 'locale_direction',
    params: { locale: 'hy', documentDirection: 'ltr' },
  },
  {
    id: 'assistant-bubbles',
    prompt: 'Why are chat bubbles flipped?',
    aspect: 'assistant_messages',
    params: { documentDirection: 'rtl' },
  },
] as const;

export const EXPLAIN_RTL_LAYOUT_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-rtl-layout',
    prompt: 'Why is text on the right?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_rtl_layout',
  },
  {
    id: 'booking-help-steal-guard',
    prompt: 'Why are chat bubbles flipped?',
    misclassifiedAction: 'booking_help',
    expectedAction: 'explain_rtl_layout',
  },
  {
    id: 'explain-app-feature-steal-guard',
    prompt: 'What is RTL?',
    misclassifiedAction: 'explain_app_feature',
    expectedAction: 'explain_rtl_layout',
  },
] as const;
