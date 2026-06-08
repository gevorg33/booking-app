/** acc-3.2 — recurring business phrasing patterns for alias learning + classify bias. */
export const HABITUAL_SERVICE_PHRASES: ReadonlyArray<{
  id: string;
  pattern: RegExp;
  aliasKeys: readonly string[];
}> = [
  {
    id: 'the-usual',
    pattern: /\b(the usual|my usual|usual one|same usual)\b/i,
    aliasKeys: ['the usual', 'usual'],
  },
  {
    id: 'my-regular',
    pattern: /\b(my regular|regular appointment|the regular)\b/i,
    aliasKeys: ['my regular', 'regular'],
  },
  {
    id: 'same-as-last',
    pattern: /\b(same as last time|like last time|same as always|repeat last)\b/i,
    aliasKeys: ['same as last', 'last time'],
  },
  {
    id: 'same-service',
    pattern: /\b(same service|same thing as before)\b/i,
    aliasKeys: ['same service'],
  },
];

export const PHRASING_BOOK_VERBS =
  /\b(book|schedule|reserve|appointment|slot|put|add|fit)\b/i;

export const PHRASING_NEAREST_VERBS =
  /\b(nearest|soonest|first available|earliest|asap|as soon as possible)\b/i;

export const PHRASING_CLASSIFIER_BIAS_RULES = `- When Business phrasing memory maps an alias to provider/service, prefer booking intents that use those entities.
- "the usual", "my regular", and staff nicknames refer to learned defaults — do not treat them as unknown customer names when memory is present.
- Service shorthand (e.g. facemassage → Face massage) should inherit the mapped serviceName param.`;
