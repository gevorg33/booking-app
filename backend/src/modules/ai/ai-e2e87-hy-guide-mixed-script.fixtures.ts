/**
 * e2e-bug.87 — hy-locale customer/public guide copy must not ship as
 * mixed-script garbage (Armenian + Latin transliteration + stray Cyrillic).
 * Live samples from the audit; the QA gate must reject these shapes.
 */
export const E2E87_CORRUPTED_HY_GUIDE_SAMPLES = [
  {
    id: 'e2e87-cyrillic-splice',
    text: '«Ծառայություններ» вкладկայում',
    reason: 'Cyrillic вклад spliced into Armenian',
  },
  {
    id: 'e2e87-latin-translit-title',
    text: 'Գlխavar, Ծառayutyunner ev Հashiv',
    reason: 'Armenian letters mixed with Latin transliteration',
  },
  {
    id: 'e2e87-underscore-latin-fragment',
    text: 'Ընտրեք ծառայություն կամ «Որքան էլի_hasaneli»։',
    reason: 'underscore-joined Latin fragment mid-sentence',
  },
  {
    id: 'e2e87-latin-run-in-step',
    text: 'Բացեք Services вкладկայում և ընտրեք ծառայությունը։',
    reason: 'Latin Services + Cyrillic вклад in a step body',
  },
] as const;

export const E2E87_CLEAN_HY_GUIDE_SAMPLES = [
  {
    id: 'e2e87-clean-title',
    text: 'Գլխավոր, Ծառայություններ և Հաշիվ',
  },
  {
    id: 'e2e87-clean-step',
    text: 'Բացեք «Ծառայություններ» և ընտրեք անհրաժեշտ ծառայությունը։',
  },
  {
    id: 'e2e87-clean-loanwords-email-sms',
    text: 'Մուտք գործեք email-ով կամ SMS կոդով։',
  },
  {
    id: 'e2e87-clean-loanword-ai',
    text: 'Ամրագրման AI օգնական',
  },
  {
    id: 'e2e46-clean-placeholder',
    text: 'Ձեր հաջորդ հաճախորդը՝ {customerName}, ժամը {time}։',
  },
] as const;
