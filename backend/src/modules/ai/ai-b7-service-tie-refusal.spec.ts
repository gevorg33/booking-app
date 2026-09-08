/**
 * tech-debt B7 / e2e-bug.367 — the two `resolveServiceByName` copies refuse a tie.
 *
 * §187 filed all four remaining re-parsers as blocked on one decision — "may
 * these surfaces ask a clarifying question" — because every copy *guesses*
 * while `EntityResolutionService` *asks*, which read as a contract change for
 * each caller.
 *
 * For these two it is not. Both callers already have a not-resolved path:
 * `ai-compare-services` collects the name into `missing[]` and reports "Could
 * not find catalog matches for: X"; `ai-pick-provider-for-service` keeps the
 * typed text and navigates to the professionals list rather than a booking. So
 * the tie can be answered with `undefined` and the existing path carries it —
 * the same "use the channel that already exists" move that closed D5-a and
 * D5-b.
 *
 * The behaviour these pin is narrow on purpose: **acceptance is unchanged**.
 * The original tiers still run for every non-tied name, so this can only refuse
 * a name that previously resolved to an arbitrary one of several equally good
 * matches.
 */
import { handleCompareServicesLogic } from './ai-compare-services.logic.js';
import type { Service } from '../service/entities/service.entity.js';

const svc = (id: string, name: string) =>
  ({
    id,
    name,
    price: 10,
    durationMinutes: 30,
    isActive: true,
  }) as unknown as Service;

/** Two services that a partial name matches equally well. */
const TIED = [
  svc('s1', 'Deep Tissue Massage'),
  svc('s2', 'Deep Tissue Facial'),
  svc('s3', 'Classic Facial'),
];

const depsWith = (services: Service[]) =>
  ({
    businessRepo: { findOne: async () => ({ id: 'b1', settings: {} }) },
    serviceRepo: { find: async () => services },
  }) as any;

const compare = (names: string[]) =>
  handleCompareServicesLogic(
    depsWith(TIED),
    'b1',
    { serviceNames: names },
    'compare them',
  );

describe('B7 — compare_services refuses a tied service name', () => {
  it('reports the tied name as unmatched rather than comparing an arbitrary one', async () => {
    // "Deep Tissue" matches both s1 and s2 equally. Before this, the first was
    // silently compared; now the name comes back through the `missing[]`
    // channel the caller already had.
    const result = await compare(['Deep Tissue', 'Classic Facial']);

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Deep Tissue');
  });

  it('still compares when every name is unambiguous — acceptance is unchanged', async () => {
    const result = await compare(['Deep Tissue Massage', 'Classic Facial']);

    expect(result.success).toBe(true);
  });
});
