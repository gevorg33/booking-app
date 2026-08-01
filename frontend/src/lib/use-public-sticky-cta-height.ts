'use client';

import { useLayoutEffect, useState } from 'react';
import {
  PUBLIC_STICKY_CTA_SELECTOR,
  measurePublicStickyCtaHeight,
} from '@/lib/public-floating-fab-layer.util';

/** Live height of the tallest `[data-public-sticky-cta]` bar (e2e-bug.220). */
export function usePublicStickyCtaHeight(): number {
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;

    const measure = () => {
      setHeight(measurePublicStickyCtaHeight(document));
    };

    measure();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;

    const observeStickies = () => {
      resizeObserver?.disconnect();
      document.querySelectorAll(PUBLIC_STICKY_CTA_SELECTOR).forEach((el) => {
        resizeObserver?.observe(el);
      });
      measure();
    };

    observeStickies();

    const mutationObserver =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(observeStickies)
        : null;
    mutationObserver?.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-public-sticky-cta', 'style', 'class'],
    });

    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
    };
  }, []);

  return height;
}
