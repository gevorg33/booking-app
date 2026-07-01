import { formatCatalogServicePriceLabel } from './ai-budget-list-services.logic.js';
import {
  enrichExplainPackageSavingsParamsFromPrompt,
  isExplainPackageSavingsPrompt,
} from './ai-explain-package-savings.util.js';
import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import { extractPackageNameFromPrompt } from './ai-self-service-booking.util.js';

type PublicPackagePreview = Awaited<
  ReturnType<
    SelfServiceBookingLogicDeps['packagesService']['listPublicPackages']
  >
>[number];

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function resolveByName<T extends { id: string; name: string }>(
  rows: readonly T[],
  name: string,
): T | undefined {
  const needle = name.trim().toLowerCase();
  return (
    rows.find((row) => row.name.toLowerCase() === needle) ??
    rows.find((row) => row.name.toLowerCase().includes(needle)) ??
    rows.find((row) => needle.includes(row.name.toLowerCase()))
  );
}

async function resolvePublicPackage(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string,
): Promise<PublicPackagePreview | undefined> {
  const packages = await deps.packagesService.listPublicPackages(businessId);
  if (typeof params.packageId === 'string' && params.packageId.trim()) {
    return packages.find((row) => row.id === params.packageId);
  }
  const packageName =
    (typeof params.packageName === 'string' && params.packageName.trim()) ||
    extractPackageNameFromPrompt(prompt);
  if (packageName) {
    return resolveByName(packages, packageName);
  }
  if (packages.length === 1) return packages[0];
  return undefined;
}

export function buildExplainPackageSavingsSummary(pkg: PublicPackagePreview): {
  summary: string;
  lines: Array<{
    serviceName: string;
    quantity: number;
    lineTotal: number;
    discountedLineTotal: number;
    lineSavings: number;
  }>;
  verdict: string;
} {
  const currency = pkg.currency ?? 'USD';
  const format = (amount: number) =>
    formatCatalogServicePriceLabel(amount, currency);
  const lines = (pkg.items ?? []).map((item) => ({
    serviceName: item.serviceName,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
    discountedLineTotal: item.discountedLineTotal,
    lineSavings: item.lineSavings,
  }));
  const { regularTotal, packagePrice, savings, savingsPercent } = pkg.pricing;
  const lineSummaries = lines.map((line) => {
    const qty = line.quantity > 1 ? `${line.quantity}× ` : '';
    return `${qty}${line.serviceName} ${format(line.lineTotal)}`;
  });
  let verdict: string;
  if (savings <= 0) {
    verdict = `${pkg.name} costs the same as booking included services separately (${format(regularTotal)}).`;
  } else {
    verdict = `${pkg.name} saves ${format(savings)} (${savingsPercent}%) vs booking separately (${format(regularTotal)} → ${format(packagePrice)}).`;
  }
  const summary = [lineSummaries.join(' · '), verdict]
    .filter(Boolean)
    .join(' ');
  return { summary, lines, verdict };
}

export async function handleExplainPackageSavingsLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichExplainPackageSavingsParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );

  if (textPrompt && !isExplainPackageSavingsPrompt(textPrompt)) {
    return failure(
      'explain_package_savings',
      'Ask whether a package saves money compared with booking services separately.',
      { clarify: true },
    );
  }

  const pkg = await resolvePublicPackage(
    deps,
    businessId,
    enriched,
    textPrompt,
  );
  if (!pkg) {
    return failure(
      'explain_package_savings',
      'Name which package to compare, or browse packages first.',
      {
        clarify: true,
        missing: ['packageName'],
        navigate: { path: 'packages', query: {} },
      },
    );
  }

  const comparison = buildExplainPackageSavingsSummary(pkg);
  return success('explain_package_savings', comparison.summary, {
    packageId: pkg.id,
    packageName: pkg.name,
    currency: pkg.currency,
    pricing: pkg.pricing,
    lines: comparison.lines,
    verdict: comparison.verdict,
    navigate: { path: 'packages', query: { packageId: pkg.id } },
  });
}
