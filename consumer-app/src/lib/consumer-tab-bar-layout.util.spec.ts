/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it } from 'vitest';
import {
  CONSUMER_FAB_MARGIN_ABOVE_TAB_PX,
  CONSUMER_FIXED_ACTION_ACTIVE_CLASS,
  CONSUMER_TAB_BAR_CORE_HEIGHT_PX,
  getConsumerFabDefaultBottomInset,
} from './consumer-tab-bar-layout.util.js';

describe('getConsumerFabDefaultBottomInset', () => {
  afterEach(() => {
    document.body.classList.remove(CONSUMER_FIXED_ACTION_ACTIVE_CLASS);
  });

  it('clears the tab bar by default', () => {
    expect(getConsumerFabDefaultBottomInset({ hasFixedActionBar: false })).toBe(
      CONSUMER_TAB_BAR_CORE_HEIGHT_PX + CONSUMER_FAB_MARGIN_ABOVE_TAB_PX,
    );
  });

  it('adds fixed action bar height when the body class is present', () => {
    document.body.classList.add(CONSUMER_FIXED_ACTION_ACTIVE_CLASS);
    expect(getConsumerFabDefaultBottomInset()).toBe(
      CONSUMER_TAB_BAR_CORE_HEIGHT_PX +
        CONSUMER_FAB_MARGIN_ABOVE_TAB_PX +
        CONSUMER_TAB_BAR_CORE_HEIGHT_PX,
    );
  });

  it('honors an explicit hasFixedActionBar option', () => {
    expect(getConsumerFabDefaultBottomInset({ hasFixedActionBar: true })).toBe(
      CONSUMER_TAB_BAR_CORE_HEIGHT_PX +
        CONSUMER_FAB_MARGIN_ABOVE_TAB_PX +
        CONSUMER_TAB_BAR_CORE_HEIGHT_PX,
    );
  });
});
