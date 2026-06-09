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
const FAB_SIZE = { width: 56, height: 56 };

function getViewportSize(): ElementSize {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  const vv = window.visualViewport;
  return {
    width: Math.round(vv?.width ?? window.innerWidth),
    height: Math.round(vv?.height ?? window.innerHeight),
  };
}

function clampPosition(pos: FloatingPosition, size: ElementSize): FloatingPosition {
  const { width: vw, height: vh } = getViewportSize();
  if (!vw || !vh) return pos;
  const maxX = Math.max(VIEWPORT_MARGIN, vw - size.width - VIEWPORT_MARGIN);
  const maxY = Math.max(VIEWPORT_MARGIN, vh - size.height - VIEWPORT_MARGIN);
  return {
    x: Math.min(Math.max(VIEWPORT_MARGIN, pos.x), maxX),
    y: Math.min(Math.max(VIEWPORT_MARGIN, pos.y), maxY),
  };
}

function defaultAnchor(bottom = DEFAULT_MARGIN): ViewportAnchor {
  return { right: DEFAULT_MARGIN, bottom };
}

function positionFromAnchor(anchor: ViewportAnchor, size: ElementSize): FloatingPosition {
  const { width: vw, height: vh } = getViewportSize();
  if (!vw || !vh) return { x: VIEWPORT_MARGIN, y: VIEWPORT_MARGIN };
  return clampPosition(
    {
      x: vw - anchor.right - size.width,
      y: vh - anchor.bottom - size.height,
    },
    size,
  );
}

function anchorFromPosition(pos: FloatingPosition, size: ElementSize): ViewportAnchor {
  const { width: vw, height: vh } = getViewportSize();
  if (!vw || !vh) return defaultAnchor();
  return {
    right: Math.max(VIEWPORT_MARGIN, vw - pos.x - size.width),
    bottom: Math.max(VIEWPORT_MARGIN, vh - pos.y - size.height),
  };
}

/** Reject stale panel measurements while the FAB is shown (and vice versa). */
export function reconcileFloatingSize(
  measured: ElementSize | null,
  estimated: ElementSize,
): ElementSize {
  if (!measured) return estimated;
  const widthRatio = measured.width / Math.max(1, estimated.width);
  const heightRatio = measured.height / Math.max(1, estimated.height);
  if (
    widthRatio > 1.35 ||
    widthRatio < 0.75 ||
    heightRatio > 1.35 ||
    heightRatio < 0.75
  ) {
    return estimated;
  }
  return measured;
}

function isCorruptStoredPosition(pos: FloatingPosition): boolean {
  return pos.x <= VIEWPORT_MARGIN + 2 && pos.y <= VIEWPORT_MARGIN + 2;
}

export function readStoredAnchor(storageKey: string, defaultBottomInset = DEFAULT_MARGIN): ViewportAnchor {
  if (typeof window === 'undefined') return defaultAnchor(defaultBottomInset);
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { right: DEFAULT_MARGIN, bottom: defaultBottomInset };
    const parsed = JSON.parse(raw) as ViewportAnchor | FloatingPosition;
    if (typeof parsed === 'object' && parsed !== null && 'right' in parsed && 'bottom' in parsed) {
      const anchor = {
        right: Math.max(VIEWPORT_MARGIN, Number(parsed.right) || DEFAULT_MARGIN),
        bottom: Math.max(VIEWPORT_MARGIN, Number(parsed.bottom) || defaultBottomInset),
      };
      const probe = positionFromAnchor(anchor, FAB_SIZE);
      if (isCorruptStoredPosition(probe)) {
        localStorage.removeItem(storageKey);
        return { right: DEFAULT_MARGIN, bottom: defaultBottomInset };
      }
      return anchor;
    }
    if ('x' in parsed && 'y' in parsed) {
      const legacy = {
        x: Number(parsed.x) || 0,
        y: Number(parsed.y) || 0,
      };
      if (isCorruptStoredPosition(legacy)) {
        localStorage.removeItem(storageKey);
        return { right: DEFAULT_MARGIN, bottom: defaultBottomInset };
      }
      return anchorFromPosition(legacy, FAB_SIZE);
    }
  } catch {
    /* ignore */
  }
  return { right: DEFAULT_MARGIN, bottom: defaultBottomInset };
}

function sizesEqual(a: ElementSize, b: ElementSize): boolean {
  return a.width === b.width && a.height === b.height;
}

export interface UseDraggableFloatingPositionOptions {
  storageKey: string;
  estimatedSize: ElementSize;
  /** Default anchor bottom inset (e.g. above salon tab bar). */
  defaultBottomInset?: number;
}

export function useDraggableFloatingPosition({
  storageKey,
  estimatedSize,
  defaultBottomInset = DEFAULT_MARGIN,
}: UseDraggableFloatingPositionOptions) {
  const anchorRef = useRef<ViewportAnchor>(defaultAnchor(defaultBottomInset));
  const sizeRef = useRef<ElementSize>(estimatedSize);
  const [position, setPosition] = useState<FloatingPosition>(() => {
    if (typeof window === 'undefined') return { x: VIEWPORT_MARGIN, y: VIEWPORT_MARGIN };
    anchorRef.current = readStoredAnchor(storageKey, defaultBottomInset);
    return positionFromAnchor(anchorRef.current, estimatedSize);
  });
  const [isDragging, setIsDragging] = useState(false);
  const [measuredSize, setMeasuredSize] = useState<ElementSize | null>(null);
  const positionRef = useRef(position);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
    captureTarget: HTMLElement | null;
  } | null>(null);
  const pressCallbackRef = useRef<(() => void) | null>(null);
  const listenersRef = useRef<{
    onMove: (e: PointerEvent) => void;
    onUp: (e: PointerEvent) => void;
  } | null>(null);
  const observeCleanupRef = useRef<(() => void) | null>(null);

  const activeSize = reconcileFloatingSize(measuredSize, estimatedSize);

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
    if (dragRef.current) return;
    anchorRef.current = readStoredAnchor(storageKey, defaultBottomInset);
    syncPositionFromAnchor(reconcileFloatingSize(measuredSize, estimatedSize));
  }, [defaultBottomInset, estimatedSize.height, estimatedSize.width, measuredSize, storageKey, syncPositionFromAnchor]);

  useEffect(() => {
    setMeasuredSize(null);
  }, [estimatedSize.width, estimatedSize.height]);

  useEffect(() => {
    if (dragRef.current) return;
    syncPositionFromAnchor(activeSize);
  }, [activeSize.width, activeSize.height, syncPositionFromAnchor]);

  useEffect(() => {
    const onViewportChange = () => syncPositionFromAnchor(sizeRef.current);
    window.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('scroll', onViewportChange);
    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.visualViewport?.removeEventListener('resize', onViewportChange);
      window.visualViewport?.removeEventListener('scroll', onViewportChange);
    };
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

  const releasePointerCapture = useCallback((pointerId: number) => {
    const target = dragRef.current?.captureTarget;
    if (!target?.hasPointerCapture?.(pointerId)) return;
    try {
      target.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const finishDrag = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const moved = drag.moved;
      const press = !moved ? pressCallbackRef.current : null;

      releasePointerCapture(e.pointerId);
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
    [persistAnchor, releasePointerCapture, removeDocumentListeners],
  );

  const startDrag = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;

      removeDocumentListeners();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* unsupported */
      }

      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: positionRef.current.x,
        originY: positionRef.current.y,
        moved: false,
        captureTarget: e.currentTarget,
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
    [estimatedSize.width, estimatedSize.height],
  );

  const bindDragHandle = useCallback(
    (options?: { onPress?: () => void }) => ({
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
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
    zIndex: 1000,
    touchAction: 'none',
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
    const update = () => {
      const next = getViewportSize();
      setViewport(next);
    };
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return viewport;
}
