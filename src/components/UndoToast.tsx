interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

const TOAST_MARGIN = 12;

/**
 * 破壊的な操作を取り消すための一時的なトースト。
 */
export function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  // 開発ハーネスではページ全体の中にサイドバーが置かれるため、実体の矩形に合わせる。
  const sidebarRect = document.querySelector('[data-siderail-sidebar]')?.getBoundingClientRect();
  const position =
    sidebarRect === undefined
      ? { left: TOAST_MARGIN, right: TOAST_MARGIN, bottom: TOAST_MARGIN }
      : {
          left: sidebarRect.left + TOAST_MARGIN,
          width: sidebarRect.width - TOAST_MARGIN * 2,
          bottom: window.innerHeight - sidebarRect.bottom + TOAST_MARGIN,
        };

  return (
    <div
      role="status"
      className="fixed z-40 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-sidebar-hover px-3 py-2 shadow-xl"
      style={position}
    >
      <span className="min-w-0 truncate text-[13px] text-sidebar-text">{message}</span>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          className="rounded-md px-2 py-1 text-[13px] text-sidebar-text transition-colors hover:bg-white/10"
        >
          元に戻す
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="閉じる"
          title="閉じる"
          className="flex size-6 items-center justify-center rounded-md text-lg leading-none text-sidebar-muted transition-colors hover:bg-white/10 hover:text-sidebar-text"
        >
          ×
        </button>
      </div>
    </div>
  );
}
