import { useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 240;
const MAX_WIDTH = 640;
const KEYBOARD_STEP = 16;

interface HarnessFrameProps {
  children: ReactNode;
}

interface DragOrigin {
  x: number;
  width: number;
}

function clampWidth(width: number): number {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
}

/**
 * 実サイドパネルに近い幅で表示し、右端のハンドルで幅を変えられる開発用の枠。
 */
export function HarnessFrame({ children }: HarnessFrameProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [dragOrigin, setDragOrigin] = useState<DragOrigin | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragOrigin({ x: event.clientX, width });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragOrigin === null) {
      return;
    }

    setWidth(clampWidth(dragOrigin.width + event.clientX - dragOrigin.x));
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragOrigin(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setWidth((current) => clampWidth(current - KEYBOARD_STEP));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setWidth((current) => clampWidth(current + KEYBOARD_STEP));
    }
  };

  return (
    <div className="flex min-h-dvh justify-start bg-sidebar-line">
      <div
        className="relative h-dvh shrink-0 border-r border-white/10 shadow-2xl"
        style={{ width }}
      >
        {children}
        <div
          role="separator"
          aria-label="サイドパネルの幅を変更"
          aria-orientation="vertical"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onKeyDown={handleKeyDown}
          className="absolute inset-y-0 right-0 w-1.5 cursor-col-resize bg-white/10 transition-colors hover:bg-white/25"
        />
      </div>
    </div>
  );
}
