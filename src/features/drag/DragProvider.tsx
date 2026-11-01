import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import type {
  DragKind,
  DragPayload,
  DragSource,
  DropHandler,
  DropPosition,
  DropPreview,
  DropSection,
} from './types';

interface DragContextValue {
  source: DragSource | null;
  preview: DropPreview | null;
  payload: DragPayload | null;
  beginPress: (
    event: ReactPointerEvent<HTMLElement>,
    source: DragSource,
    payload: DragPayload,
  ) => void;
  setDropHandler: (section: DropSection, handler: DropHandler | null) => void;
}

interface PendingPress {
  pointerId: number;
  startX: number;
  startY: number;
  source: DragSource;
  payload: DragPayload;
  dragging: boolean;
}

const DRAG_THRESHOLD = 4;

/**
 * ドラッグ元とドロップ先の組み合わせが成立するかを返す。
 *
 * - タブ一覧へのブックマークは不可（Chrome 方式でブックマークをタブに変換しない）
 * - タブ一覧へのピンは可（ピン解除）
 * - ピン一覧へのタブは可（ピン留め）
 * - ブックマーク一覧へのピン、ピン一覧へのブックマークは不可（モードが排他のため）
 */
function canDrop(section: DropSection, kind: DragKind): boolean {
  if (section === 'tab') {
    return kind !== 'bookmark';
  }
  if (section === 'bookmark') {
    return kind === 'bookmark' || kind === 'tab';
  }
  return kind === 'pin' || kind === 'tab';
}

const DragContext = createContext<DragContextValue | null>(null);

export function useDragContext(): DragContextValue {
  const value = useContext(DragContext);
  if (value === null) {
    throw new Error('DragProvider の外で useDragContext が呼ばれました');
  }
  return value;
}

/**
 * サイドバー内のタブ・ブックマークを Pointer Events でドラッグする。
 *
 * HTML5 Drag and Drop を使わないため、OS のドラッグバッジ（+ / 禁止マーク）は出ない。
 * ドラッグ元の行は非表示にし、ドロップ位置にはスケルトンを表示する。
 */
export function DragProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<DragSource | null>(null);
  const [preview, setPreview] = useState<DropPreview | null>(null);
  const [payload, setPayload] = useState<DragPayload | null>(null);

  const pendingRef = useRef<PendingPress | null>(null);
  const payloadRef = useRef<DragPayload | null>(null);
  const previewRef = useRef<DropPreview | null>(null);
  const dropHandlersRef = useRef<Partial<Record<DropSection, DropHandler>>>({});
  const suppressClickRef = useRef<(() => void) | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  }, []);

  const updatePreview = useCallback((next: DropPreview | null) => {
    const prev = previewRef.current;
    if (prev === next) {
      return;
    }
    if (
      prev !== null &&
      next !== null &&
      prev.section === next.section &&
      prev.dragType === next.dragType &&
      prev.targetId === next.targetId &&
      prev.position === next.position
    ) {
      return;
    }
    previewRef.current = next;
    setPreview(next);
  }, []);

  const setDropHandler = useCallback((section: DropSection, handler: DropHandler | null) => {
    if (handler === null) {
      delete dropHandlersRef.current[section];
    } else {
      dropHandlersRef.current[section] = handler;
    }
  }, []);

  const suppressNextClick = useCallback(() => {
    const handleClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener('click', handleClick, true);
    suppressClickRef.current = () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  const finishDrag = useCallback(
    (drop: boolean) => {
      const pending = pendingRef.current;
      const currentPreview = previewRef.current;
      const payload = payloadRef.current;

      pendingRef.current = null;
      payloadRef.current = null;
      previewRef.current = null;
      lastPointRef.current = null;
      stopAutoScroll();
      setSource(null);
      setPreview(null);
      setPayload(null);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      if (pending?.dragging === true && suppressClickRef.current !== null) {
        const cleanup = suppressClickRef.current;
        suppressClickRef.current = null;
        // pointerup 直後に発火する click を抑止してから解除する。
        window.setTimeout(cleanup, 0);
      }

      if (drop && pending?.dragging === true && currentPreview !== null && payload !== null) {
        dropHandlersRef.current[currentPreview.section]?.(payload, {
          section: currentPreview.section,
          targetId: currentPreview.targetId,
          position: currentPreview.position,
        });
      }
    },
    [stopAutoScroll],
  );

  const updatePreviewFromPoint = useCallback(
    (x: number, y: number, payload: DragPayload) => {
      const element = document.elementFromPoint(x, y);
      const sidebar = document.querySelector('[data-siderail-sidebar]');
      if (element === null || sidebar === null || !sidebar.contains(element)) {
        updatePreview(null);
        return;
      }

      const target = element.closest<HTMLElement>('[data-drop-section]');
      if (target === null) {
        // 行の隙間・余白では直前のプレビューを維持する。
        return;
      }

      const section = target.dataset.dropSection;
      const targetId = target.dataset.dropId;
      const kind = target.dataset.dropKind;
      if (
        (section !== 'bookmark' && section !== 'tab' && section !== 'pin') ||
        targetId === undefined ||
        kind === undefined
      ) {
        return;
      }

      if (!canDrop(section, payload.kind)) {
        updatePreview(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      const ratio = rect.height === 0 ? 0 : (y - rect.top) / rect.height;
      // 展開中のフォルダでは、行の下部を「フォルダの後ろ」にするとゴーストが
      // 子要素の下（フォルダ最下部）まで飛んでしまう。下部もフォルダ内の先頭として扱う。
      const expandedFolder = kind === 'folder' && target.dataset.dropExpanded === 'true';
      const position: DropPosition =
        kind === 'folder'
          ? ratio < 0.25
            ? 'before'
            : ratio > 0.75 && !expandedFolder
              ? 'after'
              : 'inside'
          : ratio < 0.5
            ? 'before'
            : 'after';

      updatePreview({ section, dragType: payload.kind, targetId, position });
    },
    [updatePreview],
  );

  useEffect(() => {
    const autoScroll = () => {
      const pending = pendingRef.current;
      const point = lastPointRef.current;
      if (pending === null || !pending.dragging || point === null) {
        autoScrollFrameRef.current = null;
        return;
      }

      const element = document.elementFromPoint(point.x, point.y);
      const scroller = element?.closest<HTMLElement>('.overflow-y-auto');
      if (scroller !== null && scroller !== undefined) {
        const rect = scroller.getBoundingClientRect();
        const edge = 24;
        const delta = point.y < rect.top + edge ? -8 : point.y > rect.bottom - edge ? 8 : 0;
        if (delta !== 0) {
          const before = scroller.scrollTop;
          scroller.scrollTop += delta;
          if (scroller.scrollTop !== before) {
            updatePreviewFromPoint(point.x, point.y, pending.payload);
          }
        }
      }

      autoScrollFrameRef.current = window.requestAnimationFrame(autoScroll);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (pending === null || event.pointerId !== pending.pointerId) {
        return;
      }

      if (!pending.dragging) {
        const dx = event.clientX - pending.startX;
        const dy = event.clientY - pending.startY;
        if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) {
          return;
        }

        pending.dragging = true;
        payloadRef.current = pending.payload;
        setPayload(pending.payload);
        setSource(pending.source);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
        suppressNextClick();
        updatePreview({
          section: pending.source.section,
          dragType: pending.payload.kind,
          targetId: pending.source.id,
          position: 'before',
        });
        if (autoScrollFrameRef.current === null) {
          autoScrollFrameRef.current = window.requestAnimationFrame(autoScroll);
        }
      }

      event.preventDefault();
      lastPointRef.current = { x: event.clientX, y: event.clientY };
      updatePreviewFromPoint(event.clientX, event.clientY, pending.payload);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (pending === null || event.pointerId !== pending.pointerId) {
        return;
      }
      finishDrag(pending.dragging);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (pending === null || event.pointerId !== pending.pointerId) {
        return;
      }
      finishDrag(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && pendingRef.current !== null) {
        finishDrag(false);
      }
    };

    const handleBlur = () => {
      if (pendingRef.current !== null) {
        finishDrag(false);
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerCancel);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      stopAutoScroll();
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [finishDrag, stopAutoScroll, suppressNextClick, updatePreview, updatePreviewFromPoint]);

  const beginPress = useCallback(
    (event: ReactPointerEvent<HTMLElement>, source: DragSource, payload: DragPayload) => {
      if (event.button !== 0 || pendingRef.current !== null) {
        return;
      }
      pendingRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        source,
        payload,
        dragging: false,
      };
    },
    [],
  );

  return (
    <DragContext.Provider value={{ source, preview, payload, beginPress, setDropHandler }}>
      {children}
    </DragContext.Provider>
  );
}
