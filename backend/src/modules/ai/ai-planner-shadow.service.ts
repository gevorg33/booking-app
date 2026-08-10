/**
 * AI-ROADMAP Phase 3 — shadow running the planner.
 *
 * Runs the planner ALONGSIDE the live pipeline on real traffic, records what it
 * would have done, and never influences the response. This is how the planner
 * earns the right to take over a surface: with the current 24.2% steal rate and
 * 27% failure rate, the disagreement queue has to be worked before anything is
 * switched over.
 *
 * Safety properties, all deliberate:
 *
 *   1. OFF by default. Enabling costs a second LLM call per message, so it is
 *      opt-in per surface via `AI_PLANNER_SHADOW_SURFACES`.
 *   2. Never throws. Any failure is swallowed and logged — a shadow run must
 *      not be able to break a request that already succeeded.
 *   3. Never touches the response. It is invoked after the reply is built and
 *      returns void; there is no path by which its output reaches the user.
 *   4. Adds no latency. Fire-and-forget, after the trace is written.
 */
import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import { AiCommandPlannerService } from './ai-command-planner.service.js';
import { AiCommandTraceService } from './ai-command-trace.service.js';
import { buildPlanTraceFields } from './ai-command-plan.trace.js';
import type { PlannerContext } from './ai-command-plan.prompt.js';

/** Comma-separated surfaces, e.g. "dashboard,provider". Empty/unset = disabled. */
export const PLANNER_SHADOW_SURFACES_KEY = 'AI_PLANNER_SHADOW_SURFACES';

export function parseShadowSurfaces(
  raw: string | undefined,
): Set<CommandSurface> {
  if (!raw) return new Set();
  const valid: CommandSurface[] = [
    'dashboard',
    'provider',
    'customer',
    'public',
  ];
  const wanted = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set(valid.filter((s) => wanted.includes(s)));
}

export type ShadowPlanRequest = {
  traceId: string;
  businessId: string;
  surface: CommandSurface;
  /** Access tier of the actor whose real request this shadows. */
  tier: AccessTier;
  message: string;
  userId?: string;
  locale?: string;
  timeZone?: string;
};

@Injectable()
export class AiPlannerShadowService {
  private readonly logger = new Logger(AiPlannerShadowService.name);

  constructor(
    private readonly planner: AiCommandPlannerService,
    private readonly commandTrace: AiCommandTraceService,
    @Optional() private readonly config?: ConfigService,
  ) {}

  private enabledSurfaces(): Set<CommandSurface> {
    const raw =
      this.config?.get<string>(PLANNER_SHADOW_SURFACES_KEY) ??
      process.env[PLANNER_SHADOW_SURFACES_KEY];
    return parseShadowSurfaces(raw);
  }

  isEnabledFor(surface: CommandSurface): boolean {
    return this.enabledSurfaces().has(surface);
  }

  /**
   * Fire-and-forget entry point for the gateway. Returns immediately; the
   * shadow run completes on its own and updates the trace row in place.
   */
  runInBackground(request: ShadowPlanRequest): void {
    // The enablement check itself reads config, so it lives inside the guard:
    // `run`'s try/catch only covers the async body, and nothing on this path
    // may throw into a request whose response has already been built.
    try {
      if (!this.isEnabledFor(request.surface)) return;
      void this.run(request);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Planner shadow dispatch failed: ${message}`);
    }
  }

  /** Awaitable form, for tests and for callers that want to sequence it. */
  async run(request: ShadowPlanRequest): Promise<void> {
    if (!this.isEnabledFor(request.surface)) return;

    try {
      const context: PlannerContext = {
        today: new Date().toISOString().slice(0, 10),
        ...(request.timeZone ? { timeZone: request.timeZone } : {}),
        ...(request.locale ? { locale: request.locale } : {}),
      };

      const outcome = await this.planner.plan({
        businessId: request.businessId,
        surface: request.surface,
        tier: request.tier,
        message: request.message,
        context,
        userId: request.userId,
      });

      await this.commandTrace.attachPlanFields(
        request.traceId,
        buildPlanTraceFields(outcome),
      );
    } catch (err: unknown) {
      // A shadow run must never surface as a user-visible failure — the real
      // response was already sent before this started.
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Planner shadow run failed (trace ${request.traceId}): ${message}`,
      );
    }
  }
}
