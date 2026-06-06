/** Dashboard classifier rules for typed date input parsing (ai-cmd-fmt-13..14). */
export const DATE_INPUT_FORMAT_CLASSIFIER_RULES = `- explain_date_input_format: READ — explain how dashboard typed date fields parse slash-separated input using the current business dateFormat (DD/MM vs MM/DD disambiguation), ISO YYYY-MM-DD acceptance, legacy DD_MM_YYYY underscore order, and how that differs from the calendar picker (direct ISO day, no slash ambiguity). Triggers: how/what/why/explain + typed/date input/date field + parse vs calendar picker. NOT preview_date_input_parse (sample parse output), NOT explain_business_date_format (display-only settings), and NOT preview_business_date_format (alternate format before saving).
- preview_date_input_parse: READ — preview how sample typed date strings resolve to ISO calendar days under the current business dateFormat (DD/MM vs MM/DD disambiguation). Triggers: preview/parse/show/resolve + typed date string(s) like 04/06/2026. Optional dateStrings array. NOT explain_date_input_format (rules explanation) and NOT preview_business_date_format (booking display preview).
- Examples:
  - "How do typed date fields parse input with our current date format?" → explain_date_input_format
  - "Explain how date input works vs the calendar picker" → explain_date_input_format
  - "When staff type dates in a field, which order is used — DD/MM or MM/DD?" → explain_date_input_format
  - "What happens when someone types 04/06/2026 in a date field?" → explain_date_input_format
  - "Preview how 04/06/2026 parses with our date format" → preview_date_input_parse, dateStrings=["04/06/2026"]
  - "What ISO day does 15/08/2026 resolve to in typed date input?" → preview_date_input_parse, dateStrings=["15/08/2026"]
  - "Preview date input parse for 04/06/2026 and 15/08/2026" → preview_date_input_parse, dateStrings=["04/06/2026","15/08/2026"]`;

export const EXPLAIN_DATE_INPUT_FORMAT_PROMPTS = [
  {
    id: 'how-typed-fields-parse',
    prompt: 'How do typed date fields parse input with our current date format?',
  },
  {
    id: 'date-input-vs-calendar-picker',
    prompt: 'Explain how date input works vs the calendar picker',
  },
  {
    id: 'which-order-dd-mm',
    prompt:
      'When staff type dates in a field, which order is used — DD/MM or MM/DD?',
  },
  {
    id: 'manual-entry-parsing',
    prompt: 'How does the dashboard parse manually entered dates?',
  },
  {
    id: 'ambiguous-typed-example',
    prompt: 'What happens when someone types 04/06/2026 in a date field?',
  },
  {
    id: 'picker-same-rules',
    prompt:
      'Does the calendar picker use the same parsing rules as typed date input?',
  },
] as const;

export const PREVIEW_DATE_INPUT_PARSE_PROMPTS = [
  {
    id: 'preview-ambiguous-0406',
    prompt: 'Preview how 04/06/2026 parses with our date format',
    dateStrings: ['04/06/2026'],
  },
  {
    id: 'iso-day-1508',
    prompt: 'What ISO day does 15/08/2026 resolve to in typed date input?',
    dateStrings: ['15/08/2026'],
  },
  {
    id: 'parse-sample-0604',
    prompt: 'Parse sample date 06/04/2026 with current business format',
    dateStrings: ['06/04/2026'],
  },
  {
    id: 'preview-iso-typed',
    prompt: 'Show how typed date 2026-06-04 is interpreted',
    dateStrings: ['2026-06-04'],
  },
  {
    id: 'preview-two-samples',
    prompt: 'Preview date input parse for 04/06/2026 and 15/08/2026',
    dateStrings: ['04/06/2026', '15/08/2026'],
  },
  {
    id: 'preview-us-style-0815',
    prompt: 'What would 08/15/2026 parse to under our current date format?',
    dateStrings: ['08/15/2026'],
  },
] as const;
