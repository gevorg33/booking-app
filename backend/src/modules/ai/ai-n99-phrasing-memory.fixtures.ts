import type { ClassificationSurface } from './ai-classification-engine.types.js';

/** n99-2.3 — per-business alias/nickname/shorthand resolves without clarify. */
export const N99_PHRASING_MEMORY_SCENARIOS = [
  {
    id: 'dashboard-en-the-usual',
    surface: 'dashboard' as ClassificationSurface,
    prompt: 'book the usual with gevorg tomorrow at 2pm',
    action: 'create_booking',
    params: { date: '2026-06-09', timeSlot: '14:00' },
    entityMemory: {
      aliases: {
        gevorg: { employeeName: 'Gevorg Gasparyan' },
        'the usual': { serviceName: 'Face massage' },
      },
    },
    expectFilled: { employeeName: 'Gevorg Gasparyan', serviceName: 'Face massage' },
    expectAlias: 'the usual',
  },
  {
    id: 'dashboard-en-nickname-only',
    surface: 'dashboard' as ClassificationSurface,
    prompt: 'schedule anna tomorrow 10am for haircut',
    action: 'create_booking',
    params: { serviceName: 'Haircut', date: '2026-06-09', timeSlot: '10:00' },
    entityMemory: {
      aliases: {
        anna: { employeeName: 'Anna Smith' },
      },
    },
    expectFilled: { employeeName: 'Anna Smith' },
    expectAlias: 'anna',
  },
  {
    id: 'dashboard-en-service-shorthand',
    surface: 'dashboard' as ClassificationSurface,
    prompt: 'book facemassage with gevorg tomorrow',
    action: 'create_booking',
    params: { employeeName: 'Gevorg Gasparyan', date: '2026-06-09' },
    entityMemory: {
      aliases: {
        facemassage: { serviceName: 'Face massage' },
        gevorg: { employeeName: 'Gevorg Gasparyan' },
      },
    },
    expectFilled: { serviceName: 'Face massage' },
    expectAlias: 'facemassage',
  },
  {
    id: 'dashboard-en-rescue-unknown',
    surface: 'dashboard' as ClassificationSurface,
    prompt: 'the usual tomorrow at 3pm',
    action: 'unknown',
    params: { date: '2026-06-09', timeSlot: '15:00' },
    actionConfidence: 0.4,
    entityMemory: {
      aliases: {
        'the usual': { serviceName: 'Face massage', employeeName: 'Anna Smith' },
      },
    },
    expectFilled: { serviceName: 'Face massage', employeeName: 'Anna Smith' },
    expectAction: 'create_booking',
    expectAlias: 'the usual',
  },
  {
    id: 'dashboard-en-business-paraphrase',
    surface: 'dashboard' as ClassificationSurface,
    prompt: 'fill gevorg gaps this week',
    action: 'unknown',
    params: {},
    actionConfidence: 0.42,
    entityMemory: {
      aliases: {},
      paraphrases: [
        {
          id: 'biz-paraphrase-fill-gaps',
          phrase: 'fill gevorg gaps this week',
          normalizedPhrase: 'fill gevorg gaps this week',
          action: 'fill_unused_slots',
          surface: 'dashboard' as const,
          source: 'recurring' as const,
          hitCount: 4,
          learnedAt: '2026-06-01T00:00:00.000Z',
        },
      ],
    },
    expectAction: 'fill_unused_slots',
    expectActionSource: 'business_paraphrase',
  },
  {
    id: 'dashboard-hy-usual',
    surface: 'dashboard' as ClassificationSurface,
    prompt: 'ամրագրել սովորականը gevorg-ի հետ վաղը',
    action: 'create_booking',
    params: { date: '2026-06-09' },
    entityMemory: {
      aliases: {
        gevorg: { employeeName: 'Gevorg Gasparyan' },
        'սովորական': { serviceName: 'Massage' },
      },
    },
    expectFilled: { employeeName: 'Gevorg Gasparyan', serviceName: 'Massage' },
  },
  {
    id: 'provider-en-my-regular',
    surface: 'provider' as ClassificationSurface,
    prompt: 'book my regular for maria tomorrow 11',
    action: 'create_booking',
    params: { customerName: 'Maria Lopez', date: '2026-06-09', timeSlot: '11:00' },
    entityMemory: {
      aliases: {
        'my regular': { serviceName: 'Haircut', employeeName: 'Sam Rivera' },
      },
    },
    expectFilled: { serviceName: 'Haircut', employeeName: 'Sam Rivera' },
    expectAlias: 'my regular',
  },
  {
    id: 'customer-en-nearest-usual',
    surface: 'customer' as ClassificationSurface,
    prompt: 'book the usual nearest slot tomorrow',
    action: 'book_nearest_slot',
    params: { date: '2026-06-09' },
    entityMemory: {
      aliases: {
        'the usual': { serviceName: 'Facial', employeeName: 'Lena Park' },
      },
    },
    expectFilled: { serviceName: 'Facial', employeeName: 'Lena Park' },
  },
  {
    id: 'public-en-service-shorthand',
    surface: 'public' as ClassificationSurface,
    prompt: 'book haircut with alex tomorrow 10',
    action: 'book_appointment',
    params: { date: '2026-06-09', timeSlot: '10:00' },
    entityMemory: {
      aliases: {
        alex: { employeeName: 'Alex Kim' },
        haircut: { serviceName: 'Haircut' },
      },
    },
    expectFilled: { employeeName: 'Alex Kim', serviceName: 'Haircut' },
  },
  {
    id: 'dashboard-en-customer-nickname',
    surface: 'dashboard' as ClassificationSurface,
    prompt: 'remind maria about tomorrow',
    action: 'send_reminder',
    params: { date: '2026-06-09' },
    entityMemory: {
      aliases: {
        maria: { customerName: 'Maria Lopez' },
      },
    },
    expectFilled: { customerName: 'Maria Lopez' },
    expectAlias: 'maria',
  },
  {
    id: 'dashboard-en-same-as-last',
    surface: 'dashboard' as ClassificationSurface,
    prompt: 'same as last time tomorrow at 4pm',
    action: 'create_booking',
    params: { date: '2026-06-09', timeSlot: '16:00' },
    entityMemory: {
      aliases: {
        'same as last': {
          serviceName: 'Deep tissue massage',
          employeeName: 'Gevorg Gasparyan',
        },
      },
    },
    expectFilled: {
      serviceName: 'Deep tissue massage',
      employeeName: 'Gevorg Gasparyan',
    },
    expectAlias: 'same as last',
  },
] as const;

export const N99_PHRASING_MEMORY_TRIM_SCENARIOS = [
  {
    id: 'trim-service-from-alias',
    action: 'create_booking',
    params: { date: '2026-06-09', timeSlot: '10:00' },
    entityMemory: {
      aliases: {
        'the usual': { serviceName: 'Face massage', employeeName: 'Anna Smith' },
      },
    },
    prompt: 'book the usual tomorrow at 10',
    issues: [{ field: 'serviceName', message: 'Which service?' }],
    expectTrimmedFields: ['serviceName'],
  },
  {
    id: 'trim-provider-from-nickname',
    action: 'create_booking',
    params: { serviceName: 'Haircut', date: '2026-06-09' },
    entityMemory: {
      aliases: {
        gevorg: { employeeName: 'Gevorg Gasparyan' },
      },
    },
    prompt: 'book haircut with gevorg tomorrow',
    issues: [{ field: 'employeeName', message: 'Which provider?' }],
    expectTrimmedFields: ['employeeName'],
  },
] as const;
