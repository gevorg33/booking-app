import { Injectable } from '@nestjs/common';
import { AiBriefingService } from './ai-briefing.service.js';
import { AiWeeklyReportService } from './ai-weekly-report.service.js';
import { AiAuditService } from './ai-audit.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiPlatformService } from './ai-platform.service.js';
import { PlanEntitlementsService } from '../billing/plan-entitlements.service.js';
import { buildCapabilitiesView } from './ai-capability.matrix.js';
import { CommandResult } from './ai-command.service.js';
import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import { dispatchMetaOpsIntent } from './ai-meta-ops-dispatch.util.js';
import type { MetaOpsDispatchContext } from './ai-meta-ops-dispatch.build.js';
import { formatExplainAiCapabilitiesSummary } from './ai-meta-ops.util.js';

/** ai-cmd-dashboard-6.1.4/6.1.5 — read/mutate helpers over the AI meta endpoints (capabilities, settings, analytics, audit, briefing, weekly-report). */
@Injectable()
export class AiMetaOpsService {
  constructor(
    private briefingService: AiBriefingService,
    private weeklyReportService: AiWeeklyReportService,
    private auditService: AiAuditService,
    private aiSettings: AiSettingsService,
    private platform: AiPlatformService,
    private planEntitlements: PlanEntitlementsService,
  ) {}

  async handleSummarizeAiBriefing(businessId: string): Promise<CommandResult> {
    const b = await this.briefingService.getMorningBriefing(businessId);
    const lines = [
      `Today (${b.date}): ${b.todaysBookings} booking(s), ${b.utilizationPercent}% utilization.`,
      b.cancellationsToday
        ? `• ${b.cancellationsToday} cancellation(s) today`
        : null,
      b.conflictsToday ? `• ${b.conflictsToday} conflict(s) today` : null,
      b.unpaidToday ? `• ${b.unpaidToday} unpaid booking(s) today` : null,
      ...b.highlights.map((h) => `• ${h}`),
    ].filter((line): line is string => Boolean(line));

    return {
      success: true,
      action: 'summarize_ai_briefing',
      summary: lines.join('\n'),
      details: b,
    };
  }

  async handleSummarizeAiWeeklyReport(
    businessId: string,
  ): Promise<CommandResult> {
    const r: any = await this.weeklyReportService.getWeeklyReport(businessId);
    const sections: Array<{ heading: string; body: string }> = r.sections ?? [];
    const lines = [
      r.title ?? 'Weekly report',
      ...sections.map((s) => `${s.heading}: ${s.body}`),
    ];

    return {
      success: true,
      action: 'summarize_ai_weekly_report',
      summary: lines.join('\n'),
      details: r,
    };
  }

  async handleExplainAiAuditLog(
    businessId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    const limit =
      typeof params.limit === 'number' && params.limit > 0
        ? Math.min(params.limit, 100)
        : 20;
    const entries = await this.auditService.getAuditLog(businessId, limit);

    if (!entries.length) {
      return {
        success: true,
        action: 'explain_ai_audit_log',
        summary: 'No AI actions recorded yet.',
        details: { entries: [] },
      };
    }

    const lines = entries
      .slice(0, 10)
      .map((e) => `• ${formatDateDisplay(e.timestamp)} — ${e.summary}`);

    return {
      success: true,
      action: 'explain_ai_audit_log',
      summary: [`${entries.length} recent AI action(s):`, ...lines].join('\n'),
      details: { entries },
    };
  }

  async handleExplainAiUsageAnalytics(
    businessId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    const days =
      typeof params.days === 'number'
        ? Math.min(90, Math.max(7, params.days))
        : 30;
    const m = await this.platform.getCommandAnalytics(businessId, days);

    const pct = (v: number) => `${Math.round(v * 100)}%`;
    const lines = [
      `AI usage over the last ${m.periodDays} day(s): ${m.totalCommands} command(s).`,
      `• Success rate: ${pct(m.successRate)}`,
      `• Clarify rate: ${pct(m.clarifyRate)}`,
      `• Approval rate: ${pct(m.approvalRate)}`,
      `• Auto-execute rate: ${pct(m.autoExecuteRate)}`,
    ];

    return {
      success: true,
      action: 'explain_ai_usage_analytics',
      summary: lines.join('\n'),
      details: m,
    };
  }

  async handleExplainAiCapabilities(
    businessId: string,
    membershipRole?: string,
  ): Promise<CommandResult> {
    const entitlements =
      await this.planEntitlements.getEntitlements(businessId);
    const view = buildCapabilitiesView(
      'dashboard',
      membershipRole,
      entitlements.tierId,
    );

    // e2e-bug.162 — ground the summary on real monthly quota fields. Never
    // present allowedIntents.length as a usage limit (action-type count ≠ quota).
    const aiCommandsThisMonth = entitlements.usage.aiCommandsThisMonth;
    const aiCommandsPerMonth = entitlements.limits.aiCommandsPerMonth;
    const aiCommandsRemaining = Math.max(
      0,
      aiCommandsPerMonth - aiCommandsThisMonth,
    );
    const summary = formatExplainAiCapabilitiesSummary({
      tierName: entitlements.tierName,
      accessTier: view.accessTier,
      allowedIntentCount: view.allowedIntents.length,
      aiCommandsThisMonth,
      aiCommandsPerMonth,
      atAiCommandLimit: entitlements.atLimit.aiCommands,
      aiUsageWarning: entitlements.aiUsageWarning,
    });

    return {
      success: true,
      action: 'explain_ai_capabilities',
      summary,
      details: {
        ...view,
        usage: entitlements.usage,
        limits: {
          aiCommandsPerMonth,
          maxProviderSeats: entitlements.limits.maxProviderSeats,
        },
        aiCommandsThisMonth,
        aiCommandsPerMonth,
        aiCommandsRemaining,
        atAiCommandLimit: entitlements.atLimit.aiCommands,
        aiUsageWarning: entitlements.aiUsageWarning,
        // Explicit: allowedIntents is action-type cardinality, not a quota.
        allowedIntentCount: view.allowedIntents.length,
        allowedIntentCountIsNotUsageQuota: true,
      },
    };
  }

  async handleSummarizeAiSettings(businessId: string): Promise<CommandResult> {
    const s = await this.aiSettings.getSettings(businessId);
    const enabledRules = s.autopilot.rules.filter((r) => r.enabled).length;
    const lines = [
      `Autopilot: ${s.autopilot.enabled ? 'ON' : 'OFF'} (${enabledRules}/${s.autopilot.rules.length} rule(s) enabled)`,
      `Macros: ${s.macros.length} saved`,
      `Playbooks: ${s.playbooks.length} configured`,
      `Confidence thresholds: low ${s.confidence.low}, high ${s.confidence.high}`,
    ];

    return {
      success: true,
      action: 'summarize_ai_settings',
      summary: lines.join('\n'),
      details: s,
    };
  }

  async handleConfigureAiAutopilot(
    businessId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    const current = await this.aiSettings.getSettings(businessId);

    if (typeof params.ruleName === 'string' && params.ruleName.trim()) {
      const needle = params.ruleName.trim().toLowerCase();
      const rule = current.autopilot.rules.find((r) =>
        r.name.toLowerCase().includes(needle),
      );
      if (!rule) {
        return {
          success: false,
          action: 'configure_ai_autopilot',
          summary: `No autopilot rule found matching "${params.ruleName}".`,
          details: { clarify: true },
        };
      }
      const enabled =
        typeof params.enabled === 'boolean' ? params.enabled : !rule.enabled;
      const rules = current.autopilot.rules.map((r) =>
        r.id === rule.id ? { ...r, enabled } : r,
      );
      const next = await this.aiSettings.updateSettings(businessId, {
        autopilot: { ...current.autopilot, rules },
      });
      return {
        success: true,
        action: 'configure_ai_autopilot',
        summary: `${rule.name} autopilot rule ${enabled ? 'enabled' : 'disabled'}.`,
        details: {
          rule: next.autopilot.rules.find((r) => r.id === rule.id),
        },
      };
    }

    if (typeof params.enabled !== 'boolean') {
      return {
        success: false,
        action: 'configure_ai_autopilot',
        summary: 'Say whether to turn autopilot on or off.',
        details: { clarify: true, missing: ['enabled'] },
      };
    }

    const next = await this.aiSettings.updateSettings(businessId, {
      autopilot: { ...current.autopilot, enabled: params.enabled },
    });
    return {
      success: true,
      action: 'configure_ai_autopilot',
      summary: `AI autopilot turned ${params.enabled ? 'on' : 'off'}.`,
      details: { autopilot: next.autopilot },
    };
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a meta-ops intent. */
  dispatchIntent(ctx: MetaOpsDispatchContext): Promise<CommandResult | null> {
    return dispatchMetaOpsIntent(this, ctx);
  }
}
