/** adopt-5.2 — cold-start / time-to-interactive helpers. */

export type StartupPlatform = 'ios' | 'android' | 'web';

export const APP_STARTUP_TTI_BUDGET_MS = 3_500;
export const APP_STARTUP_TTI_BUDGET_ANDROID_LOW_END_MS = 4_500;

export function markAppStartupBoot(): void {
  if (typeof performance === 'undefined') return;
  (globalThis as { __appStartupBootMs?: number }).__appStartupBootMs = performance.now();
}

export function readMsSinceStartupBoot(now = performance.now()): number | null {
  const boot = (globalThis as { __appStartupBootMs?: number }).__appStartupBootMs;
  if (boot == null) return null;
  return Math.max(0, Math.round(now - boot));
}

export function resetAppStartupForTests(): void {
  delete (globalThis as { __appStartupBootMs?: number }).__appStartupBootMs;
}

export function readHardwareConcurrency(): number | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const cores = navigator.hardwareConcurrency;
  return typeof cores === 'number' && Number.isFinite(cores) ? cores : undefined;
}

export function readDeviceMemoryGb(): number | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof memory === 'number' && Number.isFinite(memory) ? memory : undefined;
}

/** Heuristic for low-end Android devices used in TTI budget (adopt-5.2). */
export function isLikelyLowEndAndroid(input?: {
  platform?: StartupPlatform;
  hardwareConcurrency?: number;
  deviceMemoryGb?: number;
}): boolean {
  if (input?.platform !== 'android') return false;
  const cores = input.hardwareConcurrency ?? readHardwareConcurrency();
  const memory = input.deviceMemoryGb ?? readDeviceMemoryGb();
  if (cores != null && cores <= 4) return true;
  if (memory != null && memory <= 4) return true;
  return false;
}

export function resolveStartupTtiBudgetMs(input: {
  platform: StartupPlatform;
  lowEndAndroid?: boolean;
}): number {
  if (input.platform === 'android' && input.lowEndAndroid) {
    return APP_STARTUP_TTI_BUDGET_ANDROID_LOW_END_MS;
  }
  return APP_STARTUP_TTI_BUDGET_MS;
}

export function isWithinStartupTtiBudget(
  ms: number | null,
  budgetMs = APP_STARTUP_TTI_BUDGET_MS,
): boolean {
  if (ms == null) return true;
  return ms <= budgetMs;
}

/** Hide native splash once the WebView route shell is interactive. */
export async function hideNativeSplashWhenInteractive(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    // plugins optional during web dev
  }
}
