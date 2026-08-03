/**
 * e2e-bug.277 — public booking_help must round-trip guide + supportHandoff
 * through customer gateway convert (publicAssistantResultToCommandResult).
 */

export const E2E277_BOOKING_HELP_GUIDE_ROUNDTRIP = {
  id: 'e277-booking-help-guide-roundtrip',
  publicResult: {
    success: true,
    action: 'booking_help',
    summary: 'Step 1 of 3: Pick a service',
    navigate: { path: 'services' as const },
    sessionContext: {
      guideFlowId: 'public-booking-funnel',
      guideStepIndex: '0',
      completedSteps: '[]',
      locale: 'hy',
    },
    guide: {
      topicId: 'public-booking-funnel',
      summary: 'Step 1 of 3: Pick a service',
      steps: [
        {
          title: 'Pick a service',
          body: 'Pick a service from the public booking page.',
        },
        {
          title: 'Choose a professional',
          body: 'Choose a professional and open slot.',
        },
        {
          title: 'Confirm',
          body: 'Enter contact details and confirm.',
        },
      ],
      supportHandoff: {
        action: 'create_support_ticket' as const,
        label: 'Still stuck? (hy)',
        snapshot: {
          surface: 'public',
          locale: 'hy',
          topicId: 'public-booking-funnel',
        },
        ticket: {
          subject: 'Product guide help — public-booking-funnel',
          body: 'Product guide support handoff',
          tags: ['optischedule', 'product-guide'],
        },
      },
      guideSession: {
        guideFlowId: 'public-booking-funnel',
        guideStepIndex: 0,
        completedSteps: [] as number[],
        totalSteps: 3,
      },
    },
  },
} as const;

export const E2E277_LIVE_CASE_IDS = [
  'live-hy-short-how-to-book',
  'live-hy-en-how-to-book',
  'live-en-how-to-book',
  'live-ru-how-to-book',
  'live-en-walkthrough',
  'live-hy-walkthrough',
  'live-en-booking-help',
  'live-hy-packages-control-still-has-guide',
] as const;
