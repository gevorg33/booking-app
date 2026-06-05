// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getActiveBusinessDateFormats,
  setActiveBusinessDateFormats,
} from '@/lib/business-date-format';
import { BusinessDateFormatBootstrap } from './business-date-format-bootstrap';

describe('Sprint 34 — fmt-1.6/1.7 BusinessDateFormatBootstrap integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    setActiveBusinessDateFormats(undefined, undefined);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('hydrates active formats from auth business on mount', () => {
    act(() => {
      root.render(
        <BusinessDateFormatBootstrap
          business={{ dateFormat: 'MM/DD/YYYY', timeFormat: '12h' }}
        />,
      );
    });
    expect(getActiveBusinessDateFormats()).toEqual({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
  });

  it('prefers explicit dateFormat/timeFormat over business summary', () => {
    act(() => {
      root.render(
        <BusinessDateFormatBootstrap
          business={{ dateFormat: 'DD/MM/YYYY', timeFormat: '24h' }}
          dateFormat="YYYY-MM-DD"
          timeFormat="12h"
        />,
      );
    });
    expect(getActiveBusinessDateFormats()).toEqual({
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '12h',
    });
  });

  it('re-syncs cache when business format settings change', () => {
    act(() => {
      root.render(
        <BusinessDateFormatBootstrap
          business={{ dateFormat: 'DD/MM/YYYY', timeFormat: '24h' }}
        />,
      );
    });
    expect(getActiveBusinessDateFormats().dateFormat).toBe('DD/MM/YYYY');

    act(() => {
      root.render(
        <BusinessDateFormatBootstrap
          business={{ dateFormat: 'MM/DD/YYYY', timeFormat: '12h' }}
        />,
      );
    });
    expect(getActiveBusinessDateFormats()).toEqual({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    });
  });

  it('falls back to defaults when business formats are missing', () => {
    act(() => {
      root.render(<BusinessDateFormatBootstrap business={{}} />);
    });
    expect(getActiveBusinessDateFormats()).toEqual({
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    });
  });
});
