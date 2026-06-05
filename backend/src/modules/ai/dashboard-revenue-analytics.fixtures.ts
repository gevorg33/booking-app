export interface TotalEarningsScenario {
  id: string;
  prompt: string;
  periodHint?: string;
}

export interface TopSpecialistRevenueScenario {
  id: string;
  prompt: string;
  expectedLimit: number;
  periodHint?: string;
}

export const TOTAL_EARNINGS_SCENARIOS: TotalEarningsScenario[] = [
  {
    id: 'today_calculate',
    prompt: 'Calculate total earnings for today',
    periodHint: 'today',
  },
  {
    id: 'today_how_much',
    prompt: 'How much did we earn today?',
    periodHint: 'today',
  },
  {
    id: 'last_week',
    prompt: 'What is total revenue last week',
    periodHint: 'last week',
  },
  {
    id: 'last_month',
    prompt: 'How much did we earn last month?',
    periodHint: 'last month',
  },
  {
    id: 'this_week',
    prompt: 'Show total income this week',
    periodHint: 'this week',
  },
  {
    id: 'yesterday',
    prompt: 'Compute total sales for yesterday',
    periodHint: 'yesterday',
  },
  {
    id: 'all_time',
    prompt: 'Tell me total earnings all time',
    periodHint: 'all time',
  },
  {
    id: 'custom_range',
    prompt: 'Get total revenue from 01/05/2026 to 31/05/2026',
  },
];

export const TOP_SPECIALIST_REVENUE_SCENARIOS: TopSpecialistRevenueScenario[] =
  [
    {
      id: 'which_specialist_today',
      prompt: 'Which specialist earned the most today?',
      expectedLimit: 5,
      periodHint: 'today',
    },
    {
      id: 'top_3_last_week',
      prompt: 'Top 3 specialists by revenue last week',
      expectedLimit: 3,
      periodHint: 'last week',
    },
    {
      id: 'top_5_last_month',
      prompt: 'Top 5 providers by revenue last month',
      expectedLimit: 5,
      periodHint: 'last month',
    },
    {
      id: 'who_all_time',
      prompt: 'Who brought in the most revenue all time?',
      expectedLimit: 5,
      periodHint: 'all time',
    },
    {
      id: 'highest_earner',
      prompt: 'Which therapist had the highest revenue this week?',
      expectedLimit: 5,
      periodHint: 'this week',
    },
    {
      id: '3_best_performing',
      prompt: '3 highest revenue stylists today',
      expectedLimit: 3,
      periodHint: 'today',
    },
  ];

export const NEGATIVE_EARNINGS_SCENARIOS = [
  'Suggest top specialists for haircut on Monday',
  'How many appointments today?',
  'Show all appointments today',
  'List employees',
  'Who is available tomorrow?',
];
