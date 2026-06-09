/** prov-exp-10.3 — provider accessibility adoption surfaces and CSS hooks. */

export const PROVIDER_A11Y_ADOPTION_CSS_HOOKS = [
  '--adoption-font-scale',
  '--adoption-hit-target-min',
  '--adoption-body-font-size',
  '--adoption-caption-font-size',
  'min-height: var(--adoption-hit-target-min)',
  'provider-calendar-month__day',
  'ion-tab-button',
] as const;

export const PROVIDER_A11Y_INTEGRATION_SURFACES = [
  {
    id: 'accessibility-bootstrap',
    file: 'components/AccessibilityBootstrap.tsx',
    needles: ['applyDocumentAccessibility', 'normalizeMobileA11yLocale'],
  },
  {
    id: 'calendar-month',
    file: 'components/ProviderCalendarMonth.tsx',
    needles: ['type="button"', 'aria-label', 'aria-current'],
  },
  {
    id: 'app-shell',
    file: 'App.tsx',
    needles: ['AccessibilityBootstrap'],
  },
  {
    id: 'adoption-stylesheet',
    file: 'theme/adoption-a11y.css',
    needles: [...PROVIDER_A11Y_ADOPTION_CSS_HOOKS],
  },
] as const;
