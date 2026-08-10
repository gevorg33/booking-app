/**
 * AI-ROADMAP Phase 7 — per-tier gates and preview.
 *
 * The gap these close: `requiresConfirmation` read only `spec.confirm`, so the
 * risk tier did nothing at runtime. A T2 mis-declared as `confirm: 'never'`
 * executed money and PII operations unconfirmed, and a T3 with
 * `confirm: 'if-ambiguous'` skipped the gate whenever the plan was unambiguous.
 */
import {
  buildPlanGate,
  formatPreview,
  PREVIEW_REQUIRED_TIERS,
} from './ai-risk-gate.util.js';
import { requiresConfirmation } from './ai-command-spec.derive.js';
import type { CommandSpec, CommandRiskTier } from './ai-command-spec.types.js';
import type { CommandPlan } from './ai-command-plan.types.js';

const spec = (
  id: string,
  risk: CommandRiskTier,
  confirm: CommandSpec['confirm'] = 'if-ambiguous',
): CommandSpec => ({
  id,
  aliases: [id.replace('.', '_')],
  domain: 'appointment',
  surfaces: ['dashboard'],
  tiers: { dashboard: ['owner'] },
  risk,
  description: `Do ${id}`,
  variables: {},
  examples: [],
  confirm,
  handler: 'X',
});

const plan = (commands: [string, Record<string, unknown>][]): CommandPlan => ({
  steps: commands.map(([command, variables], i) => ({
    id: `s${i + 1}`,
    command,
    variables,
    confidence: 0.95,
    dependsOn: [],
  })),
  unresolved: [],
  topicChanged: false,
});

describe('requiresConfirmation is derived from the tier', () => {
  it('confirms a T2 even when the spec says never', () => {
    // The gap: money and PII operations executed unconfirmed if a spec was
    // mis-declared. The tier now overrides the declaration.
    expect(
      requiresConfirmation(spec('a.b', 'T2', 'never'), { ambiguous: false }),
    ).toBe(true);
  });

  it('confirms a T3 even when the plan is unambiguous', () => {
    expect(
      requiresConfirmation(spec('a.b', 'T3', 'if-ambiguous'), {
        ambiguous: false,
      }),
    ).toBe(true);
  });

  it('still honours an explicit never for a low-risk command', () => {
    // The tier raises the floor; it does not force confirmation on reads.
    expect(
      requiresConfirmation(spec('a.b', 'T0', 'never'), { ambiguous: false }),
    ).toBe(false);
  });

  it('still confirms a T1 when the plan is ambiguous', () => {
    expect(
      requiresConfirmation(spec('a.b', 'T1', 'if-ambiguous'), {
        ambiguous: true,
      }),
    ).toBe(true);
  });
});

describe('buildPlanGate', () => {
  const specs = [
    spec('catalog.list_packages', 'T0', 'never'),
    spec('appointment.reschedule', 'T1'),
    spec('appointment.mark_paid', 'T2', 'never'),
    spec('appointment.cancel_bulk', 'T3'),
  ];

  it('lets a plan of reads through without a gate', () => {
    const gate = buildPlanGate(specs, plan([['catalog.list_packages', {}]]));
    expect(gate.highestRisk).toBe('T0');
    expect(gate.requiresPreview).toBe(false);
    expect(gate.requiresConfirmation).toBe(false);
    expect(gate.preview).toEqual([]);
  });

  it('gates the whole plan when any step is T2', () => {
    // §3.3: "any T2/T3 step in the plan → whole plan requires preview + confirm
    // before any write". Confirming step 3 after steps 1 and 2 have run is a
    // notification, not a gate.
    const gate = buildPlanGate(
      specs,
      plan([
        ['catalog.list_packages', {}],
        ['appointment.mark_paid', { appointmentId: 'a1' }],
      ]),
    );
    expect(gate.highestRisk).toBe('T2');
    expect(gate.requiresPreview).toBe(true);
    expect(gate.requiresConfirmation).toBe(true);
    // The preview covers every step, not only the risky one — the user is
    // approving the plan, not the step.
    expect(gate.preview).toHaveLength(2);
  });

  it('reports the highest tier present, not the first', () => {
    const gate = buildPlanGate(
      specs,
      plan([
        ['appointment.cancel_bulk', {}],
        ['appointment.reschedule', {}],
      ]),
    );
    expect(gate.highestRisk).toBe('T3');
  });

  it('says why it fired', () => {
    const gate = buildPlanGate(specs, plan([['appointment.mark_paid', {}]]));
    expect(gate.reasons.join(' ')).toContain('T2');
  });

  it('requires confirmation whenever a preview is required', () => {
    // Showing someone what will happen and then doing it anyway is not a gate.
    for (const tier of PREVIEW_REQUIRED_TIERS) {
      const gate = buildPlanGate(
        [spec('x.y', tier, 'never')],
        plan([['x.y', {}]]),
      );
      expect(gate.requiresPreview).toBe(true);
      expect(gate.requiresConfirmation).toBe(true);
    }
  });

  describe('an unknown command', () => {
    it('forces confirmation rather than being treated as harmless', () => {
      // Validation rejects it separately; letting it sit silently inside an
      // approved preview would be the dangerous reading.
      const gate = buildPlanGate(specs, plan([['nope.nope', {}]]));
      expect(gate.requiresConfirmation).toBe(true);
      expect(gate.reasons.join(' ')).toContain('nope.nope');
    });

    it('does not appear in the preview, because it cannot be described', () => {
      const gate = buildPlanGate(
        specs,
        plan([
          ['appointment.mark_paid', {}],
          ['nope.nope', {}],
        ]),
      );
      expect(gate.preview.map((p) => p.command)).toEqual([
        'appointment.mark_paid',
      ]);
    });
  });

  describe('the preview describes the operation, not the request', () => {
    it('includes the resolved variables that will be written', () => {
      const gate = buildPlanGate(
        specs,
        plan([
          ['appointment.mark_paid', { appointmentId: 'apt-9', amount: 40 }],
        ]),
      );
      expect(gate.preview[0].description).toContain('appointmentId: apt-9');
      expect(gate.preview[0].description).toContain('amount: 40');
      expect(gate.preview[0].variables).toEqual({
        appointmentId: 'apt-9',
        amount: 40,
      });
    });

    it('omits empty values rather than showing blanks', () => {
      const gate = buildPlanGate(
        specs,
        plan([['appointment.mark_paid', { appointmentId: 'a1', note: '' }]]),
      );
      expect(gate.preview[0].description).not.toContain('note');
    });

    it('falls back to the spec description when there is nothing to show', () => {
      const gate = buildPlanGate(
        specs,
        plan([['appointment.cancel_bulk', {}]]),
      );
      expect(gate.preview[0].description).toBe('Do appointment.cancel_bulk');
    });

    it('carries the per-step risk so a client can highlight the money step', () => {
      const gate = buildPlanGate(
        specs,
        plan([
          ['appointment.reschedule', {}],
          ['appointment.mark_paid', {}],
        ]),
      );
      expect(gate.preview.map((p) => p.risk)).toEqual(['T1', 'T2']);
    });
  });

  it('flags an unresolved plan as ambiguous', () => {
    const ambiguousPlan = plan([['appointment.reschedule', {}]]);
    ambiguousPlan.unresolved = ['which John'];
    const gate = buildPlanGate(specs, ambiguousPlan);
    expect(gate.requiresConfirmation).toBe(true);
    expect(gate.reasons.join(' ')).toContain('unresolved');
  });
});

describe('formatPreview', () => {
  it('numbers the lines so a user can object to one of them', () => {
    const gate = buildPlanGate(
      [spec('a.b', 'T2'), spec('c.d', 'T1')],
      plan([
        ['a.b', { x: 1 }],
        ['c.d', {}],
      ]),
    );
    const text = formatPreview(gate.preview);
    expect(text).toContain('This will:');
    expect(text).toContain('1. ');
    expect(text).toContain('2. ');
  });

  it('renders nothing when there is no preview', () => {
    expect(formatPreview([])).toBe('');
  });
});
