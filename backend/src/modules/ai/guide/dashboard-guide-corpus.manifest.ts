import type {
  GuideCorpusContentRef,
  GuideCorpusTopic,
  GuideCorpusTopicId,
  GuideCorpusTocGroup,
} from './ai-guide-corpus.types.js';

function ref(
  kind: GuideCorpusContentRef['kind'],
  i18nKey: string,
): GuideCorpusContentRef {
  return { kind, i18nKey };
}

function steps(prefix: string, count: number): GuideCorpusContentRef[] {
  return Array.from({ length: count }, (_, index) =>
    ref('step', `${prefix}${index + 1}`),
  );
}

function bullets(prefix: string, count: number): GuideCorpusContentRef[] {
  return Array.from({ length: count }, (_, index) =>
    ref('bullet', `${prefix}${index + 1}`),
  );
}

const CORE = 'guide.core';
const OPS = 'guide.operations';
const AI = 'guide.ai';
const HELP = 'helpCenter.topics';

/** Canonical dashboard guide corpus — mirrors `/dashboard/guide` TOC + i18n keys (ai-guide-1.1.1). */
export const DASHBOARD_GUIDE_CORPUS_TOPICS: readonly GuideCorpusTopic[] = [
  {
    topicId: 'dashboard.core.schedule',
    surface: 'dashboard',
    group: 'core',
    anchor: 'schedule',
    helpCenterTopicId: 'schedule',
    navigate: { path: '/dashboard/schedule' },
    content: [
      ref('title', `${CORE}.scheduleTitle`),
      ref('summary', `${HELP}.schedule.summary`),
      ref('body', `${CORE}.scheduleBody`),
      ...steps(`${CORE}.scheduleStep`, 4),
      ...steps(`${HELP}.schedule.step`, 4),
    ],
  },
  {
    topicId: 'dashboard.core.calendar',
    surface: 'dashboard',
    group: 'core',
    anchor: 'calendar',
    helpCenterTopicId: 'calendar',
    navigate: { path: '/dashboard/calendar' },
    content: [
      ref('title', `${CORE}.calendarTitle`),
      ref('summary', `${HELP}.calendar.summary`),
      ref('body', `${CORE}.calendarBody`),
      ...steps(`${CORE}.calendarStep`, 4),
      ...steps(`${HELP}.calendar.step`, 4),
    ],
  },
  {
    topicId: 'dashboard.core.employees',
    surface: 'dashboard',
    group: 'core',
    anchor: 'employees',
    helpCenterTopicId: 'employees',
    navigate: { path: '/dashboard/employees' },
    content: [
      ref('title', `${CORE}.employeesTitle`),
      ref('summary', `${HELP}.employees.summary`),
      ref('body', `${CORE}.employeesBody`),
      ...steps(`${CORE}.employeesStep`, 4),
      ...steps(`${HELP}.employees.step`, 4),
    ],
  },
  {
    topicId: 'dashboard.operations.overview',
    surface: 'dashboard',
    group: 'operations',
    anchor: 'overview',
    content: [
      ref('title', `${OPS}.overviewTitle`),
      ref('body', `${OPS}.overviewBody`),
      ...bullets(`${OPS}.overviewPoint`, 4),
    ],
  },
  {
    topicId: 'dashboard.operations.problems',
    surface: 'dashboard',
    group: 'operations',
    anchor: 'problems',
    content: [
      ref('title', `${OPS}.problemsTitle`),
      ref('body', `${OPS}.problemsIntro`),
      ref('problem', `${OPS}.problem1`),
      ref('solution', `${OPS}.solution1`),
      ref('problem', `${OPS}.problem2`),
      ref('solution', `${OPS}.solution2`),
      ref('problem', `${OPS}.problem3`),
      ref('solution', `${OPS}.solution3`),
      ref('problem', `${OPS}.problem4`),
      ref('solution', `${OPS}.solution4`),
    ],
  },
  {
    topicId: 'dashboard.operations.workflow',
    surface: 'dashboard',
    group: 'operations',
    anchor: 'workflow',
    navigate: { path: '/dashboard/operations' },
    content: [
      ref('title', `${OPS}.workflowTitle`),
      ref('callout-title', `${OPS}.workflowTipTitle`),
      ref('callout-body', `${OPS}.workflowTipBody`),
      ...steps(`${OPS}.workflowStep`, 6),
    ],
  },
  {
    topicId: 'dashboard.operations.locations',
    surface: 'dashboard',
    group: 'operations',
    anchor: 'locations',
    content: [
      ref('title', `${OPS}.locationsTitle`),
      ref('body', `${OPS}.locationsBody`),
      ...steps(`${OPS}.locationsStep`, 3),
      ref('callout-title', `${OPS}.locationsNoteTitle`),
      ref('callout-body', `${OPS}.locationsNoteBody`),
    ],
  },
  {
    topicId: 'dashboard.operations.inventory',
    surface: 'dashboard',
    group: 'operations',
    anchor: 'inventory',
    helpCenterTopicId: 'operations-inventory',
    navigate: { path: '/dashboard/operations' },
    content: [
      ref('title', `${OPS}.inventoryTitle`),
      ref('summary', `${HELP}.operations-inventory.summary`),
      ref('body', `${OPS}.inventoryBody`),
      ...steps(`${OPS}.inventoryStep`, 4),
      ref('callout-title', `${OPS}.inventoryAutoTitle`),
      ref('callout-body', `${OPS}.inventoryAutoBody`),
      ...steps(`${HELP}.operations-inventory.step`, 3),
    ],
  },
  {
    topicId: 'dashboard.operations.expenses',
    surface: 'dashboard',
    group: 'operations',
    anchor: 'expenses',
    content: [
      ref('title', `${OPS}.expensesTitle`),
      ref('body', `${OPS}.expensesBody`),
      ...steps(`${OPS}.expensesStep`, 3),
      ref('body', `${OPS}.expensesExamples`),
    ],
  },
  {
    topicId: 'dashboard.operations.commissions',
    surface: 'dashboard',
    group: 'operations',
    anchor: 'commissions',
    content: [
      ref('title', `${OPS}.commissionsTitle`),
      ref('body', `${OPS}.commissionsBody`),
      ...steps(`${OPS}.commissionsStep`, 3),
      ref('callout-title', `${OPS}.commissionsRuleTitle`),
      ref('callout-body', `${OPS}.commissionsRuleBody`),
    ],
  },
  {
    topicId: 'dashboard.operations.pl',
    surface: 'dashboard',
    group: 'operations',
    anchor: 'pl',
    content: [
      ref('title', `${OPS}.plTitle`),
      ref('body', `${OPS}.plBody`),
      ref('bullet', `${OPS}.plRevenue`),
      ref('bullet', `${OPS}.plExpenses`),
      ref('bullet', `${OPS}.plCommissions`),
      ref('bullet', `${OPS}.plNet`),
      ref('body', `${OPS}.plFormula`),
      ...steps(`${OPS}.plStep`, 2),
    ],
  },
  {
    topicId: 'dashboard.operations.tips',
    surface: 'dashboard',
    group: 'operations',
    anchor: 'tips',
    content: [
      ref('title', `${OPS}.tipsTitle`),
      ...bullets(`${OPS}.tip`, 4),
      ref('callout-title', `${OPS}.limitationsTitle`),
      ref('callout-body', `${OPS}.limitationsBody`),
    ],
  },
  {
    topicId: 'dashboard.ai.overview',
    surface: 'dashboard',
    group: 'ai',
    anchor: 'ai-overview',
    content: [
      ref('title', `${AI}.overviewTitle`),
      ref('body', `${AI}.overviewBody`),
      ...bullets(`${AI}.overviewPoint`, 4),
    ],
  },
  {
    topicId: 'dashboard.ai.getting-started',
    surface: 'dashboard',
    group: 'ai',
    anchor: 'ai-getting-started',
    navigate: { path: '/dashboard/settings' },
    content: [
      ref('title', `${AI}.gettingStartedTitle`),
      ref('body', `${AI}.gettingStartedBody`),
      ...steps(`${AI}.gettingStartedStep`, 3),
      ref('callout-title', `${AI}.gettingStartedNoteTitle`),
      ref('callout-body', `${AI}.gettingStartedNoteBody`),
    ],
  },
  {
    topicId: 'dashboard.ai.command-bar',
    surface: 'dashboard',
    group: 'ai',
    anchor: 'ai-command-bar',
    content: [
      ref('title', `${AI}.commandBarTitle`),
      ref('body', `${AI}.commandBarBody`),
      ...steps(`${AI}.commandBarStep`, 4),
      ref('callout-title', `${AI}.commandBarTipTitle`),
      ref('callout-body', `${AI}.commandBarTipBody`),
    ],
  },
  {
    topicId: 'dashboard.ai.dashboard',
    surface: 'dashboard',
    group: 'ai',
    anchor: 'ai-dashboard',
    content: [
      ref('title', `${AI}.dashboardTitle`),
      ref('body', `${AI}.dashboardBody`),
      ...bullets(`${AI}.dashboardFeature`, 4),
    ],
  },
  {
    topicId: 'dashboard.ai.approval',
    surface: 'dashboard',
    group: 'ai',
    anchor: 'ai-approval',
    content: [
      ref('title', `${AI}.approvalTitle`),
      ref('body', `${AI}.approvalBody`),
      ...steps(`${AI}.approvalStep`, 4),
      ref('callout-title', `${AI}.approvalWarnTitle`),
      ref('callout-body', `${AI}.approvalWarnBody`),
    ],
  },
  {
    topicId: 'dashboard.ai.ops',
    surface: 'dashboard',
    group: 'ai',
    anchor: 'ai-ops',
    navigate: { path: '/dashboard/ai-ops' },
    content: [
      ref('title', `${AI}.aiOpsTitle`),
      ref('body', `${AI}.aiOpsBody`),
      ...steps(`${AI}.aiOpsStep`, 4),
    ],
  },
  {
    topicId: 'dashboard.ai.mobile',
    surface: 'dashboard',
    group: 'ai',
    anchor: 'ai-mobile',
    content: [
      ref('title', `${AI}.mobileTitle`),
      ref('body', `${AI}.mobileBody`),
      ...bullets(`${AI}.mobilePoint`, 4),
    ],
  },
  {
    topicId: 'dashboard.ai.examples',
    surface: 'dashboard',
    group: 'ai',
    anchor: 'ai-examples',
    content: [
      ref('title', `${AI}.examplesTitle`),
      ref('body', `${AI}.examplesIntro`),
      ref('example-command', `${AI}.example1Command`),
      ref('example-desc', `${AI}.example1Desc`),
      ref('example-command', `${AI}.example2Command`),
      ref('example-desc', `${AI}.example2Desc`),
      ref('example-command', `${AI}.example3Command`),
      ref('example-desc', `${AI}.example3Desc`),
      ref('example-command', `${AI}.example4Command`),
      ref('example-desc', `${AI}.example4Desc`),
      ref('example-command', `${AI}.example5Command`),
      ref('example-desc', `${AI}.example5Desc`),
      ref('example-command', `${AI}.example6Command`),
      ref('example-desc', `${AI}.example6Desc`),
    ],
  },
  {
    topicId: 'dashboard.ai.tips',
    surface: 'dashboard',
    group: 'ai',
    anchor: 'ai-tips',
    content: [
      ref('title', `${AI}.tipsTitle`),
      ...bullets(`${AI}.tip`, 5),
      ref('callout-title', `${AI}.limitationsTitle`),
      ref('callout-body', `${AI}.limitationsBody`),
    ],
  },
] as const;

export const DASHBOARD_GUIDE_CORPUS_TOPIC_IDS: readonly GuideCorpusTopicId[] =
  DASHBOARD_GUIDE_CORPUS_TOPICS.map((topic) => topic.topicId);

/** Anchors declared on `frontend/src/app/(dashboard)/dashboard/guide/page.tsx`. */
export const DASHBOARD_GUIDE_PAGE_ANCHORS: readonly string[] =
  DASHBOARD_GUIDE_CORPUS_TOPICS.map((topic) => topic.anchor);

export const DASHBOARD_GUIDE_CORPUS_TOC: readonly GuideCorpusTocGroup[] = [
  {
    id: 'core',
    navLabelKey: `${CORE}.navLabel`,
    topicIds: DASHBOARD_GUIDE_CORPUS_TOPICS.filter((t) => t.group === 'core').map(
      (t) => t.topicId,
    ),
  },
  {
    id: 'operations',
    navLabelKey: `${OPS}.navLabel`,
    topicIds: DASHBOARD_GUIDE_CORPUS_TOPICS.filter(
      (t) => t.group === 'operations',
    ).map((t) => t.topicId),
  },
  {
    id: 'ai',
    navLabelKey: `${AI}.navLabel`,
    topicIds: DASHBOARD_GUIDE_CORPUS_TOPICS.filter((t) => t.group === 'ai').map(
      (t) => t.topicId,
    ),
  },
] as const;

export const HELP_CENTER_TOPIC_TO_CORPUS_TOPIC_ID: Readonly<
  Record<string, GuideCorpusTopicId>
> = Object.fromEntries(
  DASHBOARD_GUIDE_CORPUS_TOPICS.filter((topic) => topic.helpCenterTopicId).map(
    (topic) => [topic.helpCenterTopicId!, topic.topicId],
  ),
);

export const GUIDE_CORPUS_ANCHOR_TO_TOPIC_ID: Readonly<
  Record<string, GuideCorpusTopicId>
> = Object.fromEntries(
  DASHBOARD_GUIDE_CORPUS_TOPICS.map((topic) => [topic.anchor, topic.topicId]),
);

/** Full guide page URL for a corpus topic. */
export function buildDashboardGuideTopicUrl(topicId: GuideCorpusTopicId): string {
  const topic = DASHBOARD_GUIDE_CORPUS_TOPICS.find((row) => row.topicId === topicId);
  if (!topic) return '/dashboard/guide';
  return `/dashboard/guide#${topic.anchor}`;
}
