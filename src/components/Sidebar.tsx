import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { flattenBookmarkItems } from '@/features/bookmarks/tree';
import { useBookmarks } from '@/features/bookmarks/useBookmarks';
import { DragProvider } from '@/features/drag/DragProvider';
import type { DraggedPin } from '@/features/drag/types';
import { useMode } from '@/features/mode/useMode';
import { usePins, type UndoPinnedTab } from '@/features/pins/usePins';
import { useCurrentWindowTabs } from '@/features/tabs/useCurrentWindowTabs';
import { BookmarkSection } from './BookmarkSection';
import { PinSection } from './PinSection';
import { TabSection } from './TabSection';
import { UndoToast } from './UndoToast';

const DIVIDER_HEIGHT = 10;
const MIN_PANE_HEIGHT = 80;
const DEFAULT_RATIO = 0.62;
const RATIO_STEP = 0.05;
const MIN_RATIO = 0.1;
const MAX_RATIO = 0.9;
const UNDO_DURATION_MS = 6000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface SidebarLayoutProps {
  ratio: number;
  onRatioChange: (ratio: number) => void;
  top: ReactNode;
  bottom: ReactNode;
}

/**
 * 上段・Divider・下段のグリッド。モードによらず共通の高さ調整を提供する。
 */
function SidebarLayout({ ratio, onRatioChange, top, bottom }: SidebarLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateRatioFromClientY = (clientY: number) => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const availableHeight = rect.height - DIVIDER_HEIGHT;
    if (availableHeight <= 0) {
      return;
    }

    const minPaneHeight = Math.min(MIN_PANE_HEIGHT, availableHeight / 2);
    const topHeight = clamp(
      clientY - rect.top - DIVIDER_HEIGHT / 2,
      minPaneHeight,
      availableHeight - minPaneHeight,
    );
    onRatioChange(clamp(topHeight / availableHeight, MIN_RATIO, MAX_RATIO));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateRatioFromClientY(event.clientY);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    updateRatioFromClientY(event.clientY);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return;
    }

    event.preventDefault();
    onRatioChange(
      clamp(ratio + (event.key === 'ArrowDown' ? RATIO_STEP : -RATIO_STEP), MIN_RATIO, MAX_RATIO),
    );
  };

  return (
    /*
      `grid-cols-1` (minmax(0, 1fr)) で列幅をサイドバー幅に固定する。
      既定の auto 列のままだと、長いタブタイトルの min-content 幅で列が広がり、
      右端に寄せたツールバーのボタンが画面外へ押し出される。
    */
    <div
      ref={containerRef}
      data-siderail-sidebar
      className="grid h-dvh grid-cols-1 bg-sidebar-bg text-sidebar-text"
      style={{ gridTemplateRows: `${ratio}fr ${DIVIDER_HEIGHT}px ${1 - ratio}fr` }}
    >
      {top}

      <div
        role="separator"
        aria-label="上段と下段の高さを変更"
        aria-orientation="horizontal"
        aria-valuemin={Math.round(MIN_RATIO * 100)}
        aria-valuemax={Math.round(MAX_RATIO * 100)}
        aria-valuenow={Math.round(ratio * 100)}
        title="ドラッグして高さを調整"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onKeyDown={handleKeyDown}
        className="group flex cursor-row-resize touch-none items-center px-2.5 select-none focus-visible:outline-none"
      >
        <div
          className={[
            'h-px w-full transition-colors',
            isDragging
              ? 'bg-sidebar-text'
              : 'bg-sidebar-divider group-hover:bg-sidebar-muted group-focus-visible:bg-sidebar-muted',
          ].join(' ')}
        />
      </div>

      <div className="flex min-h-0 flex-col">{bottom}</div>
    </div>
  );
}

interface SidebarBodyProps {
  ratio: number;
  onRatioChange: (ratio: number) => void;
}

function ChromeSidebar({ ratio, onRatioChange }: SidebarBodyProps) {
  const { tabs } = useCurrentWindowTabs();

  return (
    <SidebarLayout
      ratio={ratio}
      onRatioChange={onRatioChange}
      top={<BookmarkSection />}
      bottom={<TabSection tabs={tabs} mode="chrome" />}
    />
  );
}

function ArcSidebar({ ratio, onRatioChange }: SidebarBodyProps) {
  const { items, ready: bookmarksReady, toggleFolder } = useBookmarks();
  const bookmarks = useMemo(() => flattenBookmarkItems(items), [items]);
  const { tabs, ready: tabsReady } = useCurrentWindowTabs();
  const pins = usePins(bookmarks, tabs, bookmarksReady && tabsReady);
  const [undo, setUndo] = useState<UndoPinnedTab | null>(null);

  useEffect(() => {
    if (undo === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setUndo(null);
    }, UNDO_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [undo]);

  const handleUnpin = (pin: DraggedPin) => {
    void pins
      .unpinPin(pin)
      .then((record) => {
        setUndo(record);
      })
      .catch((error: unknown) => {
        console.error('ピンを解除できませんでした', error);
      });
  };

  const handleUndo = () => {
    if (undo === null) {
      return;
    }

    const record = undo;
    setUndo(null);
    void pins.undoUnpin(record).catch((error: unknown) => {
      console.error('ピン解除を取り消せませんでした', error);
    });
  };

  return (
    <>
      <SidebarLayout
        ratio={ratio}
        onRatioChange={onRatioChange}
        top={
          <PinSection
            items={items}
            pins={pins}
            onToggleFolder={toggleFolder}
            onUnpin={handleUnpin}
          />
        }
        bottom={<TabSection tabs={tabs} mode="arc" onUnpinPin={handleUnpin} />}
      />
      {undo !== null && (
        <UndoToast
          message="ピンを解除しました"
          onUndo={handleUndo}
          onDismiss={() => {
            setUndo(null);
          }}
        />
      )}
    </>
  );
}

export function Sidebar() {
  const { mode, ready } = useMode();
  const [ratio, setRatio] = useState(DEFAULT_RATIO);

  if (!ready) {
    return null;
  }

  return (
    <DragProvider>
      {mode === 'arc' ? (
        <ArcSidebar ratio={ratio} onRatioChange={setRatio} />
      ) : (
        <ChromeSidebar ratio={ratio} onRatioChange={setRatio} />
      )}
    </DragProvider>
  );
}
