import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import {
  buildPackageVisitRulesSummaryFromCatalog,
  enrichExplainPackageVisitRulesParamsFromPrompt,
  isExplainPackageVisitRulesPrompt,
  parseExplainPackageVisitRulesFromPrompt,
} from './ai-explain-package-visit-rules.util.js';
import type { ExplainPackageVisitRulesFocus } from './ai-explain-package-visit-rules.fixtures.js';
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

export async function handleExplainPackageVisitRulesLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichExplainPackageVisitRulesParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );
  const focus = enriched.focus as ExplainPackageVisitRulesFocus;

  if (textPrompt && !isExplainPackageVisitRulesPrompt(textPrompt)) {
    return failure(
      'explain_package_visit_rules',
      'Ask how package visit bundles work — for example "Can I cancel one visit and keep the package?" or "Do unused visits expire?".',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_package_visit_rules', 'Business not found.');
  }

  const pkg = await resolvePublicPackage(
    deps,
    businessId,
    enriched,
    textPrompt,
  );
  if (!pkg) {
    return failure(
      'explain_package_visit_rules',
      'Name which package to explain, or browse packages first.',
      {
        clarify: true,
        missing: ['packageName'],
        navigate: { path: 'packages', query: {} },
      },
    );
  }

  const parsed = parseExplainPackageVisitRulesFromPrompt(textPrompt, enriched);
  const explanation = buildPackageVisitRulesSummaryFromCatalog(
    {
      name: pkg.name,
      description: pkg.description,
      expiresAt: pkg.expiresAt,
      items: (pkg.items ?? []).map((item) => ({
        serviceName: item.serviceName,
        quantity: item.quantity,
      })),
    },
    business.settings,
    parsed?.focus ?? focus,
  );

  return success('explain_package_visit_rules', explanation.summary, {
    packageId: pkg.id,
    packageName: pkg.name,
    focus: parsed?.focus ?? focus,
    policyLines: explanation.policyLines,
    catalogLines: explanation.catalogLines,
    selfServiceLines: explanation.selfServiceLines,
    expiresAt: pkg.expiresAt ?? null,
    description: pkg.description ?? null,
    navigate: { path: 'packages', query: { packageId: pkg.id } },
  });
}
