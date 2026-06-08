/** adopt-4.7 — Capacitor bridge to native home-screen widgets. */

import { Capacitor, registerPlugin } from '@capacitor/core';
import {
  type HomeScreenWidgetSnapshot,
  serializeHomeScreenWidgetSnapshot,
} from './home-screen-widget.util.js';

export interface HomeScreenWidgetPlugin {
  syncSnapshot(options: { json: string }): Promise<void>;
}

const HomeScreenWidget = registerPlugin<HomeScreenWidgetPlugin>('HomeScreenWidget', {
  web: () => import('./home-screen-widget-web.js').then((m) => new m.HomeScreenWidgetWeb()),
});

export async function syncHomeScreenWidgetSnapshot(
  snapshot: HomeScreenWidgetSnapshot,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await HomeScreenWidget.syncSnapshot({
    json: serializeHomeScreenWidgetSnapshot(snapshot),
  });
}
