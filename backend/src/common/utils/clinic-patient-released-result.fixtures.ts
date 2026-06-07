export const PATIENT_RELEASED_RESULT_ROLLUP_SCENARIOS = [
  {
    id: 'rollup-prefers-abnormal-over-high',
    resultFlag: 'High',
    measurementFlags: ['Normal', 'Abnormal'],
    expected: 'Abnormal',
  },
  {
    id: 'rollup-prefers-high-over-normal',
    resultFlag: null,
    measurementFlags: ['Normal', 'High'],
    expected: 'High',
  },
  {
    id: 'rollup-prefers-low-over-normal',
    resultFlag: 'Normal',
    measurementFlags: ['Low'],
    expected: 'Low',
  },
  {
    id: 'rollup-uses-result-flag-when-no-measurements',
    resultFlag: 'Inconclusive',
    measurementFlags: [],
    expected: 'Inconclusive',
  },
  {
    id: 'rollup-null-when-no-flags',
    resultFlag: null,
    measurementFlags: [null, ''],
    expected: null,
  },
] as const;

export const PATIENT_RELEASED_MEASUREMENT_FLAG_SCENARIOS = [
  {
    id: 'uses-stored-flag',
    measurementFlag: 'High',
    abnormalFlags: 'L',
    expected: 'High',
  },
  {
    id: 'derives-from-abnormal-flags',
    measurementFlag: null,
    abnormalFlags: 'H',
    expected: 'High',
  },
  {
    id: 'ignores-unknown-flag',
    measurementFlag: 'Unexpected',
    abnormalFlags: null,
    expected: null,
  },
] as const;
