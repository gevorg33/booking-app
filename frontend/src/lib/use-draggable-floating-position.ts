'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefCallback,
} from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

export interface FloatingPosition {
  x: number;
  y: number;
}

/** Distance from viewport bottom-right — stable when widget size changes (open ↔ collapsed). */
interface ViewportAnchor {
  right: number;
  bottom: number;
}

const DRAG_THRESHOLD = 5;
const VIEWPORT_MARGIN = 8;
const DEFAULT_MARGIN = 24;

function clampPosition(pos: FloatingPosition, size: ElementSize): FloatingPosition {
  if (typeof window === 'undefined') return pos;
  const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - size.width - VIEWPORT_MARGIN);
  const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - size.height - VIEWPORT_MARGIN);
  return {
    x: Math.min(Math.max(VIEWPORT_MARGIN, pos.x), maxX),
    y: Math.min(Math.max(VIEWPORT_MARGIN, pos.y), maxY),
  };
}

function defaultAnchor(bottom = DEFAULT_MARGIN): ViewportAnchor {
  return { right: DEFAULT_MARGIN, bottom };
}

function positionFromAnchor(anchor: ViewportAnchor, size: ElementSize): FloatingPosition {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  return clampPosition(
    {
      x: window.innerWidth - anchor.right - size.width,
      y: window.innerHeight - anchor.bottom - size.height,
    },
    size,
  );
}

function anchorFromPosition(pos: FloatingPosition, size: ElementSize): ViewportAnchor {
  if (typeof window === 'undefined') return defaultAnchor();
  return {
    right: Math.max(VIEWPORT_MARGIN, window.innerWidth - pos.x - size.width),
    bottom: Math.max(VIEWPORT_MARGIN, window.innerHeight - pos.y - size.height),
  };
}

function readStoredAnchor(
  storageKey: string,
  defaultBottomInset = DEFAULT_MARGIN,
): ViewportAnchor {
  if (typeof window === 'undefined') return defaultAnchor(defaultBottomInset);
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultAnchor(defaultBottomInset);
    const parsed = JSON.parse(raw) as ViewportAnchor | FloatingPosition;
    if (typeof parsed === 'object' && parsed !== null && 'right' in parsed && 'bottom' in parsed) {
      return {
        right: Math.max(VIEWPORT_MARGIN, Number(parsed.right) || DEFAULT_MARGIN),
        bottom: Math.max(
          VIEWPORT_MARGIN,
          Number(parsed.bottom) || defaultBottomInset,
        ),
      };
    }
    if ('x' in parsed && 'y' in parsed) {
      return anchorFromPosition(
        { x: Number(parsed.x) || 0, y: Number(parsed.y) || 0 },
        { width: 48, height: 48 },
      );
    }
  } catch {
    /* ignore */
  }
  return defaultAnchor(defaultBottomInset);
}

function sizesEqual(a: ElementSize, b: ElementSize): boolean {
  return a.width === b.width && a.height === b.height;
}

export interface UseDraggableFloatingPositionOptions {
  storageKey: string;
  estimatedSize: ElementSize;
  /** Default anchor bottom inset (e.g. stacked above Zendesk — e2e-bug.123). */
  defaultBottomInset?: number;
  /**
   * Optional post-read nudge (e.g. clear third-party launcher conflict zone).
   * Return a new anchor when adjustment is needed; persist happens automatically.
   */
  reconcileAnchor?: (anchor: ViewportAnchor) => ViewportAnchor;
}

export function useDraggableFloatingPosition({
  storageKey,
  estimatedSize,
  defaultBottomInset = DEFAULT_MARGIN,
  reconcileAnchor,
}: UseDraggableFloatingPositionOptions) {
  const anchorRef = useRef<ViewportAnchor>(defaultAnchor(defaultBottomInset));
  const sizeRef = useRef<ElementSize>(estimatedSize);
  // Keep initial position SSR-stable; restore from storage in useLayoutEffect before paint.
  const [position, setPosition] = useState<FloatingPosition>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [measuredSize, setMeasuredSize] = useState<ElementSize | null>(null);
  const reconcileAnchorRef = useRef(reconcileAnchor);
  reconcileAnchorRef.current = reconcileAnchor;

  const positionRef = useRef(position);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const pressCallbackRef = useRef<(() => void) | null>(null);
  const listenersRef = useRef<{
    onMove: (e: PointerEvent) => void;
    onUp: (e: PointerEvent) => void;
  } | null>(null);
  const observeCleanupRef = useRef<(() => void) | null>(null);

  const activeSize = measuredSize ?? estimatedSize;

  const persistAnchor = useCallback(
    (anchor: ViewportAnchor) => {
      anchorRef.current = anchor;
      try {
        localStorage.setItem(storageKey, JSON.stringify(anchor));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const syncPositionFromAnchor = useCallback((size: ElementSize = sizeRef.current) => {
    setPosition(positionFromAnchor(anchorRef.current, size));
  }, []);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    sizeRef.current = activeSize;
  }, [activeSize]);

  useLayoutEffect(() => {
    let anchor = readStoredAnchor(storageKey, defaultBottomInset);
    const reconcile = reconcileAnchorRef.current;
    if (reconcile) {
      const next = reconcile(anchor);
      if (next.right !== anchor.right || next.bottom !== anchor.bottom) {
        anchor = next;
        try {
          localStorage.setItem(storageKey, JSON.stringify(anchor));
        } catch {
          /* ignore */
        }
      }
    }
    anchorRef.current = anchor;
    syncPositionFromAnchor(sizeRef.current);
  }, [storageKey, defaultBottomInset, syncPositionFromAnchor]);

  useEffect(() => {
    if (dragRef.current) return;
    syncPositionFromAnchor(activeSize);
  }, [activeSize.width, activeSize.height, syncPositionFromAnchor]);

  useEffect(() => {
    const onResize = () => syncPositionFromAnchor(sizeRef.current);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [syncPositionFromAnchor]);

  const removeDocumentListeners = useCallback(() => {
    const listeners = listenersRef.current;
    if (!listeners) return;
    window.removeEventListener('pointermove', listeners.onMove);
    window.removeEventListener('pointerup', listeners.onUp);
    window.removeEventListener('pointercancel', listeners.onUp);
    listenersRef.current = null;
    document.body.style.removeProperty('user-select');
    document.body.style.removeProperty('cursor');
  }, []);

  const finishDrag = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const moved = drag.moved;
      const press = !moved ? pressCallbackRef.current : null;

      dragRef.current = null;
      pressCallbackRef.current = null;
      setIsDragging(false);
      removeDocumentListeners();

      if (moved) {
        const finalPos = clampPosition(
          { x: drag.originX + dx, y: drag.originY + dy },
          sizeRef.current,
        );
        setPosition(finalPos);
        persistAnchor(anchorFromPosition(finalPos, sizeRef.current));
        return;
      }

      setPosition((p) => clampPosition(p, sizeRef.current));
      press?.();
    },
    [persistAnchor, removeDocumentListeners],
  );

  const startDrag = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0) return;

      removeDocumentListeners();
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: positionRef.current.x,
        originY: positionRef.current.y,
        moved: false,
      };

      const onMove = (ev: PointerEvent) => {
        const active = dragRef.current;
        if (!active || active.pointerId !== ev.pointerId) return;

        const dx = ev.clientX - active.startX;
        const dy = ev.clientY - active.startY;

        if (!active.moved) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
          active.moved = true;
          setIsDragging(true);
          document.body.style.userSelect = 'none';
          document.body.style.cursor = 'grabbing';
        }

        setPosition(
          clampPosition(
            { x: active.originX + dx, y: active.originY + dy },
            sizeRef.current,
          ),
        );
      };

      const onUp = (ev: PointerEvent) => finishDrag(ev);

      listenersRef.current = { onMove, onUp };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [finishDrag, removeDocumentListeners],
  );

  useEffect(() => () => removeDocumentListeners(), [removeDocumentListeners]);

  const floatingRef: RefCallback<HTMLElement> = useCallback(
    (node) => {
      observeCleanupRef.current?.();
      observeCleanupRef.current = null;

      if (!node || typeof ResizeObserver === 'undefined') {
        if (!node) setMeasuredSize(null);
        return;
      }

      const updateSize = () => {
        const rect = node.getBoundingClientRect();
        const next = {
          width: Math.max(1, Math.round(rect.width)),
          height: Math.max(1, Math.round(rect.height)),
        };
        setMeasuredSize((prev) => (prev && sizesEqual(prev, next) ? prev : next));
      };

      updateSize();
      const observer = new ResizeObserver(updateSize);
      observer.observe(node);
      observeCleanupRef.current = () => observer.disconnect();
    },
    [],
  );

  const bindDragHandle = useCallback(
    (options?: { onPress?: () => void }) => ({
      onPointerDown: (e: ReactPointerEvent) => {
        e.stopPropagation();
        pressCallbackRef.current = options?.onPress ?? null;
        startDrag(e);
      },
      style: {
        touchAction: 'none' as const,
        cursor: isDragging ? ('grabbing' as const) : ('grab' as const),
      },
    }),
    [isDragging, startDrag],
  );

  const floatingStyle: CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    zIndex: 50,
  };

  return {
    floatingRef,
    floatingStyle,
    bindDragHandle,
    isDragging,
  };
}

export function useViewportSize() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const update = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return viewport;
}
