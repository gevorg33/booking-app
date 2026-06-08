import { WebPlugin } from '@capacitor/core';
import type { HomeScreenWidgetPlugin } from './home-screen-widget-native.js';

/** Web stub — widgets are native-only (adopt-4.7). */
export class HomeScreenWidgetWeb extends WebPlugin implements HomeScreenWidgetPlugin {
  async syncSnapshot(): Promise<void> {
    // no-op on web
  }
}
