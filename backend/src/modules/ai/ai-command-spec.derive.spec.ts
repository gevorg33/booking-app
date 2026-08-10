import { APPOINTMENT_COMMAND_SPECS } from './ai-command-spec.appointment.js';
import { CATALOG_COMMAND_SPECS } from './ai-command-spec.catalog.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import {
  buildPlannerShortlist,
  buildToolDefinition,
  isSpecAllowedOnSurface,
  requiresConfirmation,
  resolveSpecByAction,
  specsForSurface,
  validateCommandVariables,
} from './ai-command-spec.derive.js';
import type { CommandSpec } from './ai-command-spec.types.js';

const spec = (id: string): CommandSpec => {
  const found = APPOINTMENT_COMMAND_SPECS.find((s) => s.id === id);
  if (!found) throw new Error(`missing spec ${id}`);
  return found;
};

describe('ai-command-spec derivations', () => {
  describe('resolveSpecByAction', () => {
    it('resolves by canonical id', () => {
      expect(
        resolveSpecByAction(APPOINTMENT_COMMAND_SPECS, 'appointment.reschedule')
          ?.id,
      ).toBe('appointment.reschedule');
    });

    it("resolves by legacy alias, so stored traces and today's classifier keep working", () => {
      expect(
        resolveSpecByAction(APPOINTMENT_COMMAND_SPECS, 'reschedule_booking')
          ?.id,
      ).toBe('appointment.reschedule');
      expect(
        resolveSpecByAction(APPOINTMENT_COMMAND_SPECS, 'mark_paid')?.id,
      ).toBe('appointment.mark_paid');
    });

    it('returns undefined for an unknown action rather than guessing', () => {
      expect(
        resolveSpecByAction(APPOINTMENT_COMMAND_SPECS, 'nope'),
      ).toBeUndefined();
    });
  });

  describe('surface gating', () => {
    it('keeps a customer-only command off the dashboard (e2e-bug.349 class)', () => {
      const cancelMine = spec('appointment.cancel_mine');
      expect(isSpecAllowedOnSurface(cancelMine, 'customer')).toBe(true);
      expect(isSpecAllowedOnSurface(cancelMine, 'dashboard')).toBe(false);
    });

    it('a dashboard request never even sees customer-only commands as candidates', () => {
      const ids = specsForSurface(APPOINTMENT_COMMAND_SPECS, 'dashboard').map(
        (s) => s.id,
      );
      expect(ids).not.toContain('appointment.cancel_mine');
      expect(ids).not.toContain('appointment.book_public');
      expect(ids).toContain('appointment.create');
    });
  });

  describe('buildPlannerShortlist', () => {
    it('gives the planner a description, required/optional vars and examples per command', () => {
      const entry = buildPlannerShortlist(
        APPOINTMENT_COMMAND_SPECS,
        'dashboard',
        'owner',
      ).find((e) => e.command === 'appointment.reschedule');
      expect(entry).toMatchObject({
        command: 'appointment.reschedule',
        requiredVariables: ['appointmentId', 'newStart'],
        optionalVariables: ['employeeName'],
      });
      expect(entry?.description).toContain('Move an existing appointment');
      expect(entry?.examples.length).toBeGreaterThan(0);
    });

    it('is surface-scoped', () => {
      const publicList = buildPlannerShortlist(
        APPOINTMENT_COMMAND_SPECS,
        'public',
        'client',
      );
      expect(publicList.map((e) => e.command)).toEqual([
        'appointment.book_public',
      ]);
    });
  });

  describe('buildToolDefinition', () => {
    it('generates a valid function-calling schema from the spec', () => {
      expect(buildToolDefinition(spec('appointment.reschedule'))).toEqual({
        name: 'appointment_reschedule',
        description: expect.stringContaining('Move an existing appointment'),
        parameters: {
          type: 'object',
          properties: {
            appointmentId: { type: 'string', description: expect.any(String) },
            newStart: { type: 'string', description: expect.any(String) },
            employeeName: { type: 'string', description: expect.any(String) },
          },
          required: ['appointmentId', 'newStart'],
          additionalProperties: false,
        },
      });
    });

    it('carries enums through so the model cannot invent a status', () => {
      const def = buildToolDefinition(spec('appointment.update_bulk'));
      expect(def.parameters.properties.status).toMatchObject({
        type: 'string',
        enum: ['confirmed', 'completed', 'no_show', 'in_progress'],
      });
    });
  });

  describe('validateCommandVariables', () => {
    const reschedule = spec('appointment.reschedule');

    it('accepts a complete, well-typed variable bag', () => {
      expect(
        validateCommandVariables(reschedule, {
          appointmentId: 'apt-1',
          newStart: '2026-08-04T15:00:00Z',
        }),
      ).toEqual({ valid: true, missing: [], unknown: [], invalid: [] });
    });

    it('names the missing required variables, which is what the clarify question asks for', () => {
      const result = validateCommandVariables(reschedule, {
        appointmentId: 'apt-1',
      });
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(['newStart']);
    });

    it('treats blank strings as missing, not as supplied', () => {
      expect(
        validateCommandVariables(reschedule, {
          appointmentId: 'apt-1',
          newStart: '   ',
        }).missing,
      ).toEqual(['newStart']);
    });

    it('surfaces hallucinated params instead of silently dropping them (e2e-bug.156)', () => {
      const result = validateCommandVariables(reschedule, {
        appointmentId: 'apt-1',
        newStart: '2026-08-04T15:00:00Z',
        customerName: 'Test User',
        templateName: 'Standard Mon-Fri',
      });
      expect(result.unknown).toEqual(['customerName', 'templateName']);
    });

    it('rejects wrong types and out-of-enum values', () => {
      expect(
        validateCommandVariables(spec('appointment.mark_paid'), {
          appointmentId: 'apt-1',
          amount: 'forty',
        }).invalid,
      ).toEqual(['amount']);

      expect(
        validateCommandVariables(spec('appointment.update_bulk'), {
          status: 'teleported',
        }).invalid,
      ).toEqual(['status']);
    });
  });

  describe('requiresConfirmation', () => {
    it('always confirms money and bulk commands, even when unambiguous', () => {
      expect(
        requiresConfirmation(spec('appointment.mark_paid'), {
          ambiguous: false,
        }),
      ).toBe(true);
      expect(
        requiresConfirmation(spec('appointment.cancel_bulk'), {
          ambiguous: false,
        }),
      ).toBe(true);
    });

    it('confirms a single mutate only when the plan is ambiguous', () => {
      const reschedule = spec('appointment.reschedule');
      expect(requiresConfirmation(reschedule, { ambiguous: false })).toBe(
        false,
      );
      expect(requiresConfirmation(reschedule, { ambiguous: true })).toBe(true);
    });
  });

  describe('nested object variables (catalog pilot)', () => {
    const bulk = CATALOG_COMMAND_SPECS.find(
      (s) => s.id === 'catalog.create_with_services',
    )!;

    it('generates a nested JSON Schema the model can fill directly', () => {
      const def = buildToolDefinition(bulk);
      expect(def.parameters.properties.catalogDraft).toMatchObject({
        type: 'object',
        required: ['categoryName', 'services'],
        properties: {
          categoryName: { type: 'string' },
          services: {
            type: 'array',
            items: {
              type: 'object',
              required: ['serviceName', 'durationMinutes', 'price'],
            },
          },
        },
      });
    });

    it('accepts a well-formed nested draft', () => {
      expect(
        validateCommandVariables(bulk, {
          catalogDraft: {
            categoryName: 'Y',
            services: [{ serviceName: 'A', durationMinutes: 30, price: 50 }],
          },
        }),
      ).toEqual({ valid: true, missing: [], unknown: [], invalid: [] });
    });

    it('reports the missing field by dotted path, not just "catalogDraft"', () => {
      // This is what lets the clarify question say "I need the category name"
      // instead of the useless "I need catalogDraft".
      const result = validateCommandVariables(bulk, {
        catalogDraft: {
          services: [{ serviceName: 'A', durationMinutes: 30, price: 50 }],
        },
      });
      expect(result.missing).toEqual(['catalogDraft.categoryName']);
    });

    it('indexes the offending item when one service line is incomplete', () => {
      const result = validateCommandVariables(bulk, {
        catalogDraft: {
          categoryName: 'Y',
          services: [
            { serviceName: 'A', durationMinutes: 30, price: 50 },
            { serviceName: 'B', durationMinutes: 45 },
          ],
        },
      });
      expect(result.missing).toEqual(['catalogDraft.services[1].price']);
    });

    it('rejects a wrongly-typed nested value', () => {
      const result = validateCommandVariables(bulk, {
        catalogDraft: {
          categoryName: 'Y',
          services: [
            { serviceName: 'A', durationMinutes: 'thirty', price: 50 },
          ],
        },
      });
      expect(result.invalid).toEqual([
        'catalogDraft.services[0].durationMinutes',
      ]);
    });

    it('surfaces hallucinated nested params too', () => {
      const result = validateCommandVariables(bulk, {
        catalogDraft: {
          categoryName: 'Y',
          services: [{ serviceName: 'A', durationMinutes: 30, price: 50 }],
          templateName: 'Standard Mon-Fri',
        },
      });
      expect(result.unknown).toEqual(['catalogDraft.templateName']);
    });
  });

  describe('read-only commands (T0)', () => {
    const listPackages = CATALOG_COMMAND_SPECS.find(
      (s) => s.id === 'catalog.list_packages',
    )!;

    it('never requires confirmation, even when the plan is ambiguous', () => {
      expect(requiresConfirmation(listPackages, { ambiguous: true })).toBe(
        false,
      );
    });

    it('is valid with no variables at all', () => {
      expect(validateCommandVariables(listPackages, {}).valid).toBe(true);
    });
  });

  describe('spec hygiene', () => {
    it('every spec is well formed', () => {
      for (const s of COMMAND_SPECS) {
        expect(s.id).toMatch(/^[a-z_]+\.[a-z_]+$/);
        expect(s.surfaces.length).toBeGreaterThan(0);
        expect(s.description.length).toBeGreaterThan(20);
        expect(s.examples.length).toBeGreaterThan(0);
        expect(s.handler.length).toBeGreaterThan(0);
      }
    });

    it('ids and aliases are globally unique (no two commands answer to one name)', () => {
      const names = COMMAND_SPECS.flatMap((s) => [s.id, ...s.aliases]);
      expect(names.length).toBe(new Set(names).size);
    });

    it('money and bulk commands always confirm', () => {
      for (const s of COMMAND_SPECS) {
        if (s.risk === 'T2' || s.risk === 'T3')
          expect(s.confirm).toBe('always');
      }
    });
  });
});
