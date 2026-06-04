'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clampDashboardSidebarWidth,
  DASHBOARD_SIDEBAR_DEFAULT_WIDTH,
  persistDashboardSidebarWidth,
  readDashboardSidebarWidth,
} from './dashboard-sidebar-width';

export function useResizableSidebar() {
  const [width, setWidth] = useState(DASHBOARD_SIDEBAR_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(width);

  useEffect(() => {
    setWidth(readDashboardSidebarWidth());
  }, []);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizing]);

  const nudgeWidth = useCallback((delta: number) => {
    setWidth((current) => {
      const next = clampDashboardSidebarWidth(current + delta);
      persistDashboardSidebarWidth(next);
      return next;
    });
  }, []);

  const startResize = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    setIsResizing(true);

    const startX = event.clientX;
    const startWidth = widthRef.current;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const next = clampDashboardSidebarWidth(startWidth + (moveEvent.clientX - startX));
      widthRef.current = next;
      setWidth(next);
    };

    const onPointerUp = () => {
      handle.releasePointerCapture(event.pointerId);
      handle.removeEventListener('pointermove', onPointerMove);
      handle.removeEventListener('pointerup', onPointerUp);
      handle.removeEventListener('pointercancel', onPointerUp);
      setIsResizing(false);
      persistDashboardSidebarWidth(widthRef.current);
    };

    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerUp);
    handle.addEventListener('pointercancel', onPointerUp);
  }, []);

  return { width, isResizing, startResize, nudgeWidth };
}
