import type { CommandSurface } from './ai-command-registry.types.js';
import {
  SIMILAR_APP_GUIDE_PROMPTS,
  TOP_APP_GUIDE_FLOWS,
} from './ai-product-guide.fixtures.js';

const SURFACES: CommandSurface[] = ['dashboard', 'provider', 'customer', 'public'];

/** Loose NL shape check — corpus is classifier/eval fodder, not pipe-1.2-only phrasing. */
const APP_GUIDE_CORPUS_SIGNAL =
  /\b(how|where|what|why|walk|help|guide|explain|show me|step by step|can i|i'?m|tell me|give me|summarize|overview|ask the|which tab|this page|this screen|stuck|confused|new to|first time|without| vs |difference|mean|works|steps|funnel|tab|page|screen|tour|guest|confirmation|payment|checkout|booking|appointment|assistant|activation|availability|services|professionals)\b/i;

function promptsForFlow(surface: CommandSurface, flowId: string) {
  return SIMILAR_APP_GUIDE_PROMPTS.filter(
    (row) => row.surface === surface && row.id.startsWith(`${surface}-${flowId}-v`),
  );
}

describe('SIMILAR_APP_GUIDE_PROMPTS (ai-guide-1.6.2)', () => {
  it('defines 20 top guide flows per surface', () => {
    for (const surface of SURFACES) {
      expect(
        TOP_APP_GUIDE_FLOWS.filter((flow) => flow.surface === surface),
      ).toHaveLength(20);
    }
    expect(TOP_APP_GUIDE_FLOWS).toHaveLength(80);
  });

  it('has unique flow ids within each surface', () => {
    for (const surface of SURFACES) {
      const ids = TOP_APP_GUIDE_FLOWS.filter((f) => f.surface === surface).map(
        (f) => f.id,
      );
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('has unique prompt ids across the corpus', () => {
    const ids = SIMILAR_APP_GUIDE_PROMPTS.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(TOP_APP_GUIDE_FLOWS.map((flow) => [flow.id, flow] as const))(
    'flow %s has ≥10 NL prompt variants on its surface',
    (flowId, flow) => {
      const rows = promptsForFlow(flow.surface, flowId);
      expect(rows.length).toBeGreaterThanOrEqual(10);
      for (const row of rows) {
        expect(row.surface).toBe(flow.surface);
        expect(row.topicId).toBe(flow.topicId);
        expect(row.prompt.trim().length).toBeGreaterThan(8);
      }
    },
  );

  it.each(SIMILAR_APP_GUIDE_PROMPTS.map((row) => [row.id, row] as const))(
    'prompt $id reads like a guide/help utterance',
    (_id, row) => {
      expect(APP_GUIDE_CORPUS_SIGNAL.test(row.prompt)).toBe(true);
    },
  );

  it('covers customer/public top-20 topicIds from guide-flow-customer-public corpus', () => {
    const customerTopics = new Set(
      TOP_APP_GUIDE_FLOWS.filter((f) => f.surface === 'customer').map((f) => f.topicId),
    );
    const publicTopics = new Set(
      TOP_APP_GUIDE_FLOWS.filter((f) => f.surface === 'public').map((f) => f.topicId),
    );
    expect(customerTopics.has('consumer-getting-started')).toBe(true);
    expect(customerTopics.has('consumer-activation-welcome')).toBe(true);
    expect(publicTopics.has('public-booking-funnel')).toBe(true);
    expect(publicTopics.has('public-checkout')).toBe(true);
  });
});
