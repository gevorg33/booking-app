/**
 * e2e-bug.330 — remaining guide playbooks (~41, dashboard/provider/overlays/
 * availability) lack a curated `shortTitleKey`. Rather than hand-author
 * ~390 curated strings (130 steps × 3 locales) with unverifiable HY/RU
 * quality, `humanizeGuideStepTitle`'s generic fallback was hardened so it
 * never lands on a dangling preposition/conjunction/article/copula
 * ("Navigate weeks with", "Track products and") or a bare clause-boundary
 * dash ("Locations — add").
 */

export type E2e330HumanizeCase = {
  id: string;
  title: string;
  body: string;
  expected: string;
};

/** Direct unit probes for the new humanize branches. */
export const E2E330_HUMANIZE_CASES: readonly E2e330HumanizeCase[] = [
  {
    id: 'en-dangling-preposition-extends',
    title: 'Step 2',
    body: 'Navigate weeks with the arrows; jump to today with the button.',
    expected: 'Navigate weeks with the arrows;',
  },
  {
    id: 'en-dangling-conjunction-extends',
    title: 'Step 2',
    body: 'Track products and consumables used per service.',
    expected: 'Track products and consumables',
  },
  {
    id: 'en-dangling-copula-extends',
    title: 'Step 4',
    body: 'Overlapping periods are flagged so you can resolve conflicts.',
    expected: 'Overlapping periods are flagged',
  },
  {
    id: 'en-dash-label-skips-to-real-clause',
    title: 'Step 1',
    body: 'Locations — add each branch as its own location with its own hours.',
    expected: 'Add each branch',
  },
  {
    id: 'en-trailing-dash-token-dropped',
    title: 'Step 2',
    body: 'Expand any task — see specialized agent output as it runs.',
    expected: 'Expand any task',
  },
  {
    id: 'en-leading-subordinator-skips-to-main-clause',
    title: 'Step 1',
    body: 'When AI proposes a multi-step plan, review each step before confirming.',
    expected: 'Review each step before confirming',
  },
  {
    id: 'en-already-clean-unaffected',
    title: 'Step 3',
    body: 'Cross-check against Bookings if a slot looks wrong.',
    expected: 'Cross-check against Bookings',
  },
  {
    id: 'hy-dangling-conjunction-extends',
    title: 'Քայլ 1',
    body: 'Ասեք «և» կամ «ապա»-ով միացրեք մի քանի հրաման։',
    expected: 'Ասեք «և» կամ «ապա»-ով',
  },
  {
    id: 'ru-dangling-preposition-extends',
    title: 'Шаг 2',
    body: 'Сравните выручку с расходами за тот же период.',
    expected: 'Сравните выручку с расходами',
  },
  {
    id: 'ru-trailing-dash-token-dropped',
    title: 'Шаг 2',
    body: 'Разверните задачу — посмотрите вывод специализированного агента.',
    expected: 'Разверните задачу посмотрите',
  },
];
