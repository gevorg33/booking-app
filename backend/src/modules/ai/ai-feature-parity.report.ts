import type { AiParityCoverageReport } from './ai-feature-catalog.types.js';
import {
  formatCoveragePercent,
  listCoverageGaps,
} from './ai-feature-parity.util.js';
import {
  formatSprint56BacklogLine,
  formatUncoveredActionLine,
  listTopUncoveredActions,
  mergeUncoveredMaps,
} from './ai-feature-parity-coverage.util.js';
import { formatAllowDenyParityReport } from './ai-feature-allow-deny-parity.util.js';

export function formatAiParityReport(report: AiParityCoverageReport): string {
  const lines: string[] = [
    'AI Feature Parity Coverage Report (parity-1.5)',
    `Generated: ${report.generatedAt}`,
    `Catalog entries: ${report.catalogEntryCount} (${report.confirmedEntryCount} confirmed, ${report.unconfirmedCandidateCount} extraction backlog)`,
    `Usage signals: trace_rows=${report.usageAvailability.traceRows} analytics_rows=${report.usageAvailability.analyticsRows}`,
    '',
    'Per role / surface:',
  ];

  for (const row of report.byRoleSurface) {
    lines.push(
      `  ${row.tier.padEnd(7)} ${row.surface.padEnd(9)} covered=${formatCoveragePercent(row.coveragePercent)} (${row.coveredCount}/${row.uiActionCount}) gaps=${row.gapCount} scope_bugs=${row.scopeBugCount}`,
    );
    if (row.uncoveredRanked.length > 0) {
      lines.push('    Uncovered (usage-ranked):');
      for (const [index, action] of row.uncoveredRanked.slice(0, 8).entries()) {
        lines.push(formatUncoveredActionLine(action, index + 1));
      }
      if (row.uncoveredRanked.length > 8) {
        lines.push(`    ... and ${row.uncoveredRanked.length - 8} more`);
      }
    }
  }

  const gaps = listCoverageGaps(report);
  lines.push('');
  lines.push(`Unique coverage gaps: ${gaps.length}`);
  if (gaps.length > 0) {
    for (const gap of gaps.slice(0, 20)) {
      lines.push(`  - ${gap}`);
    }
    if (gaps.length > 20) {
      lines.push(`  ... and ${gaps.length - 20} more`);
    }
  }

  lines.push('');
  lines.push(`Sprint 56 backlog: ${report.sprint56Backlog.length} items`);
  for (const [index, item] of report.sprint56Backlog.slice(0, 25).entries()) {
    lines.push(formatSprint56BacklogLine(item, index + 1));
  }
  if (report.sprint56Backlog.length > 25) {
    lines.push(`  ... and ${report.sprint56Backlog.length - 25} more`);
  }

  const globalUncovered = listTopUncoveredActions(
    mergeUncoveredMaps(report.byRoleSurface.flatMap((row) => [...row.uncoveredRanked])),
    10,
  );
  if (globalUncovered.length > 0) {
    lines.push('');
    lines.push('Top uncovered by usage (all roles):');
    for (const [index, action] of globalUncovered.entries()) {
      lines.push(formatUncoveredActionLine(action, index + 1));
    }
  }

  lines.push('');
  lines.push(formatAllowDenyParityReport(report.allowDenyParity));

  if (report.extractionBacklog.length > 0) {
    lines.push('');
    lines.push('Extraction backlog (unconfirmed):');
    for (const id of report.extractionBacklog) {
      lines.push(`  - ${id}`);
    }
  }

  return lines.join('\n');
}

export { buildAiParityCoverageReport } from './ai-feature-parity.util.js';
