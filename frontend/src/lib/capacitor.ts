/** Capacitor runtime helpers — safe to import on web (dynamic import). */

export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
}

export async function getCapacitorPlatform(): Promise<'ios' | 'android' | 'web'> {
  if (!isCapacitorNative()) return 'web';
  try {
    const { Capacitor } = await import('@capacitor/core');
    const p = Capacitor.getPlatform();
    if (p === 'ios' || p === 'android') return p;
    return 'web';
  } catch {
    return 'web';
  }
}

export async function initCapacitorApp(): Promise<void> {
  if (!isCapacitorNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    /* plugins optional during web dev */
  }
}

/** Keep splash visible until the WebView has painted (native dev server mode). */
export async function hideCapacitorSplashWhenReady(): Promise<void> {
  if (!isCapacitorNative()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    /* optional */
  }
}
