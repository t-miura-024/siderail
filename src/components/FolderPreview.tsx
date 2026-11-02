import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { computeFolderPreviewLayout } from '@/features/bookmarks/folderPreview';
import { Favicon } from './Favicon';

function getSidebarElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-siderail-sidebar]');
}

interface FolderPreviewProps {
  anchor: DOMRect;
  label: string;
  /** 反転判定に使う、表示する行数。 */
  itemCount: number;
  children: ReactNode;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onClose: () => void;
}

/**
 * 折りたたみフォルダの内容をホバーで見せる浮遊カード。
 * サイドパネルはパネル外へ描画できないため、パネルの矩形内に収める。
 */
export function FolderPreview({
  anchor,
  label,
  itemCount,
  children,
  onPointerEnter,
  onPointerLeave,
  onClose,
}: FolderPreviewProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const sidebarRect = getSidebarElement()?.getBoundingClientRect();
  const layout = computeFolderPreviewLayout(
    anchor,
    {
      left: sidebarRect?.left ?? 0,
      top: sidebarRect?.top ?? 0,
      width: sidebarRect?.width ?? window.innerWidth,
      height: sidebarRect?.height ?? window.innerHeight,
    },
    itemCount,
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (popupRef.current !== null && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleScroll = (event: Event) => {
      if (
        popupRef.current !== null &&
        event.target instanceof Node &&
        popupRef.current.contains(event.target)
      ) {
        return;
      }
      onClose();
    };
    const handleResize = () => {
      onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={popupRef}
      role="dialog"
      aria-label={label}
      className="fixed z-30 flex flex-col gap-1 overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-sidebar-bg p-1.5 shadow-2xl"
      style={{
        left: layout.left,
        top: layout.top,
        width: layout.width,
        maxHeight: layout.maxHeight,
        transform: layout.above ? 'translateY(-100%)' : undefined,
      }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>,
    document.body,
  );
}

interface PreviewRowProps {
  title: string;
  url: string;
  liveTabUrl?: string | undefined;
  isOpen?: boolean | undefined;
  isActive?: boolean | undefined;
  onClick: () => void;
}

/**
 * Folder Preview の1行。開閉状態とアクティブだけを示し、
 * 閉じる・ミュート・右クリック・ドラッグは持たない。
 */
export function PreviewRow({
  title,
  url,
  liveTabUrl,
  isOpen,
  isActive = false,
  onClick,
}: PreviewRowProps) {
  const faviconUrl = liveTabUrl ?? url;
  const dimmed = isOpen === false;

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'group flex h-10 w-full shrink-0 items-center gap-3 rounded-xl px-2.5 text-left text-[15px] transition-colors',
        isActive ? 'bg-sidebar-active' : 'hover:bg-sidebar-hover',
        dimmed ? 'text-sidebar-muted group-hover:text-sidebar-text' : 'text-sidebar-text',
      ].join(' ')}
    >
      <span
        className={dimmed ? 'opacity-50 transition-opacity group-hover:opacity-100' : undefined}
      >
        <Favicon key={faviconUrl} url={faviconUrl} />
      </span>
      <span className="min-w-0 truncate">{title}</span>
    </button>
  );
}
