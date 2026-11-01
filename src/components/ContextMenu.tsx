import { Fragment, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuAction {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  label: string;
  actions: readonly ContextMenuAction[];
  onClose: () => void;
}

const MENU_WIDTH = 176;
const ITEM_HEIGHT = 32;
const MENU_PADDING = 24;
const VIEWPORT_MARGIN = 8;

const ITEM_CLASS_NAME =
  'flex h-8 w-full items-center rounded-md px-2 text-left text-[13px] text-sidebar-text transition-colors hover:bg-white/5';

/**
 * 行の右クリックで表示する操作メニュー。
 */
export function ContextMenu({ x, y, label, actions, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current !== null && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const menuHeight = actions.length * ITEM_HEIGHT + MENU_PADDING;
  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(x, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN),
  );
  const top = Math.max(
    VIEWPORT_MARGIN,
    Math.min(y, window.innerHeight - menuHeight - VIEWPORT_MARGIN),
  );

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      className="fixed z-50 flex w-44 flex-col gap-0.5 rounded-lg border border-white/10 bg-sidebar-hover p-1 shadow-xl"
      style={{ left, top }}
    >
      {actions.map((action, index) => (
        <Fragment key={action.label}>
          {action.destructive === true && index > 0 && <div className="my-0.5 h-px bg-white/10" />}
          <button
            type="button"
            role="menuitem"
            onClick={action.onSelect}
            className={ITEM_CLASS_NAME}
          >
            <span className={action.destructive === true ? 'text-[#f08383]' : undefined}>
              {action.label}
            </span>
          </button>
        </Fragment>
      ))}
    </div>,
    document.body,
  );
}
