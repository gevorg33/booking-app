/**
 * §98 — the planner is told what shape each variable is.
 *
 * The shortlist used to render variables as bare names. Asked for `catalogDraft`
 * with nothing saying it was an object, the model answered with a sentence —
 * 25 of 28 variable rejections on rescue-dependent traffic came from that one
 * omission.
 */
import {
  buildPlannerShortlist,
  plannerVariableHints,
} from './ai-command-spec.derive.js';
import { buildPlannerSystemPrompt } from './ai-command-plan.prompt.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import type { CommandSpec } from './ai-command-spec.types.js';

const spec = (variables: CommandSpec['variables']): CommandSpec =>
  ({
    id: 'catalog.demo',
    aliases: ['demo'],
    domain: 'catalog',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['owner'] },
    risk: 'T1',
    description: 'd',
    variables,
    examples: [],
    confirm: 'never',
    handler: 'H',
  }) as CommandSpec;

const hint = (s: CommandSpec, name: string) =>
  plannerVariableHints(s).find((h) => h.name === name);

describe('plannerVariableHints', () => {
  it('names a scalar type', () => {
    expect(
      hint(
        spec({ price: { type: 'number', description: '', required: true }, resolver: 'none' }),
        'price',
      )?.type,
    ).toBe('number');
  });

  it('spells out an array of strings rather than "string[]"', () => {
    // The model produced a bare string for `serviceNames` six times.
    expect(
      hint(
        spec({
          serviceNames: { type: 'string[]', description: '', required: true, resolver: 'none' },
        }),
        'serviceNames',
      )?.type,
    ).toBe('array of string');
  });

  it('expands an object into its properties', () => {
    const s = spec({
      draft: {
        type: 'object',
        description: '',
        required: true,
        properties: {
          categoryName: { type: 'string', description: '', required: true, resolver: 'none' },
          note: { type: 'string', description: '', required: false, resolver: 'none' },
        },
      },
    });
    expect(hint(s, 'draft')?.type).toBe(
      '{ categoryName: string, note?: string }',
    );
  });

  it('recurses into an array of objects', () => {
    // One level was not enough: the model filled the outer object and left the
    // array items empty, turning 28 type errors into 72 missing nested fields.
    const s = spec({
      draft: {
        type: 'object',
        description: '',
        required: true,
        properties: {
          services: {
            type: 'object[]',
            description: '',
            required: true,
            properties: {
              serviceName: { type: 'string', description: '', required: true, resolver: 'none' },
              price: { type: 'number', description: '', required: true, resolver: 'none' },
            },
          },
        },
      },
    });
    expect(hint(s, 'draft')?.type).toBe(
      '{ services: array of { serviceName: string, price: number } }',
    );
  });

  it('stops at depth 3 rather than rendering an unreadable line', () => {
    const leaf = { type: 'string' as const, description: '', required: true };
    const nest = (d: number): CommandSpec['variables'][string] =>
      d === 0
        ? leaf
        : {
            type: 'object',
            description: '',
            required: true,
            properties: { child: nest(d - 1) },
          };
    const rendered = hint(spec({ deep: nest(6) }), 'deep')?.type ?? '';
    expect(rendered).toContain('object');
    expect(rendered.length).toBeLessThan(200);
  });

  it('carries enum values', () => {
    const s = spec({
      status: {
        type: 'string',
        description: '',
        required: true,
        enum: ['confirmed', 'completed'],
      },
    });
    expect(hint(s, 'status')?.enum).toEqual(['confirmed', 'completed']);
  });

  it('is emitted for every command in the shortlist', () => {
    const entries = buildPlannerShortlist(COMMAND_SPECS, 'dashboard', 'owner');
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      const declared = e.requiredVariables.length + e.optionalVariables.length;
      expect(e.variableHints.length).toBe(declared);
    }
  });
});

describe('the rendered prompt', () => {
  const prompt = buildPlannerSystemPrompt(COMMAND_SPECS, 'dashboard', 'owner', {
    today: '2026-08-08',
  });

  it('shows a type beside every named variable', () => {
    // Guards the regression directly: a bare `required: catalogDraft` is what
    // caused this. Every variable line must carry a parenthesised type.
    const bareNames = prompt
      .split('\n')
      .filter((l) => l.trimStart().startsWith('required: '))
      .filter((l) => !l.includes('(none)'))
      .filter((l) => !l.includes('('));
    expect(bareNames).toEqual([]);
  });

  it('describes array and object variables in words the model can act on', () => {
    expect(prompt).toContain('array of');
  });
});
