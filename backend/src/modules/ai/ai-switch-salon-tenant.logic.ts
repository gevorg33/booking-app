import type { CommandResult } from './command-completion.types.js';
import {
  matchRecentSalonByHint,
  parseRecentSalonsFromParams,
} from './ai-saved-salons.shared.js';
import {
  buildSwitchSalonTenantNavigate,
  buildSwitchSalonTenantPickerNavigate,
  isSwitchSalonTenantPrompt,
  parseSwitchSalonTenantFromPrompt,
} from './ai-switch-salon-tenant.util.js';

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

function buildAmbiguousSalonSummary(salons: Array<{ name: string }>): string {
  const lines = salons
    .slice(0, 5)
    .map((salon) => `• ${salon.name}`)
    .join('\n');
  return `Multiple saved salons match. Pick one:\n${lines}`;
}

export async function handleSwitchSalonTenantLogic(
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');

  if (textPrompt && !isSwitchSalonTenantPrompt(textPrompt)) {
    return failure(
      'switch_salon_tenant',
      'Say which salon you want to switch to, for example "Go back to Glow Nails".',
      { clarify: true },
    );
  }

  const parsed = parseSwitchSalonTenantFromPrompt(textPrompt, params);
  if (!parsed) {
    return failure(
      'switch_salon_tenant',
      'Name the salon you want to open or use the salon switcher.',
      { clarify: true },
    );
  }

  const recentSalons = parseRecentSalonsFromParams(params);
  const currentSlug =
    typeof params.slug === 'string' ? params.slug.trim() : undefined;
  const hint = parsed.salonSlug ?? parsed.salonName;

  if (!hint) {
    if (recentSalons.length === 1 && recentSalons[0].slug !== currentSlug) {
      const target = recentSalons[0];
      return success('switch_salon_tenant', `Opening ${target.name}.`, {
        salonSlug: target.slug,
        salonName: target.name,
        navigate: buildSwitchSalonTenantNavigate(target.slug),
      });
    }
    return success(
      'switch_salon_tenant',
      'Tap Switch salon on Home to pick a remembered place.',
      {
        navigate: buildSwitchSalonTenantPickerNavigate(),
        recentSalons,
      },
    );
  }

  const matched = matchRecentSalonByHint(recentSalons, hint);
  if (matched === 'ambiguous') {
    const candidates = recentSalons.filter((salon) =>
      hint
        ? salon.name.toLowerCase().includes(hint.toLowerCase()) ||
          salon.slug.toLowerCase().includes(hint.toLowerCase())
        : false,
    );
    return failure(
      'switch_salon_tenant',
      buildAmbiguousSalonSummary(candidates),
      {
        clarify: true,
        missing: ['salonName'],
        candidates: candidates.map((salon) => ({
          slug: salon.slug,
          name: salon.name,
        })),
      },
    );
  }

  if (!matched) {
    return failure(
      'switch_salon_tenant',
      recentSalons.length
        ? 'That salon is not in your saved list on this device. Try the salon switcher or book there once first.'
        : 'No saved salons on this device yet. Book at a salon first, then you can switch back quickly.',
      {
        clarify: true,
        missing: ['salonName'],
        recentSalons,
        navigate: buildSwitchSalonTenantPickerNavigate(),
      },
    );
  }

  if (matched.slug === currentSlug) {
    return success(
      'switch_salon_tenant',
      `You are already in ${matched.name}.`,
      {
        salonSlug: matched.slug,
        salonName: matched.name,
        alreadyActive: true,
      },
    );
  }

  return success('switch_salon_tenant', `Switching to ${matched.name}.`, {
    salonSlug: matched.slug,
    salonName: matched.name,
    navigate: buildSwitchSalonTenantNavigate(matched.slug),
  });
}
