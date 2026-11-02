import { Folder, FolderOpen } from 'lucide-react';
import type { MouseEvent, PointerEvent } from 'react';
import { useDragContext } from '@/features/drag/DragProvider';
import { Favicon } from './Favicon';

type TreeSection = 'bookmark' | 'pin';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface BookmarkRowProps {
  id: string;
  parentId: string;
  index: number;
  title: string;
  url: string;
  depth: number;
  onClick: () => void;
  onOpenContextMenu: (position: ContextMenuPosition) => void;
}

interface BookmarkFolderRowProps {
  id: string;
  title: string;
  depth: number;
  expanded: boolean;
  isDropTarget: boolean;
  /** 折りたたみ中に開いている子孫ピンを peek 表示しているか。 */
  peeked?: boolean;
  dropSection?: TreeSection;
  /** 行の高さクラス。すべての行で h-10（40px）。 */
  heightClass?: string;
  onToggle: () => void;
  onOpenContextMenu: (position: ContextMenuPosition) => void;
  /** Folder Preview を出すためのホバー開始。 */
  onPreviewEnter?: ((event: PointerEvent<HTMLButtonElement>) => void) | undefined;
  /** Folder Preview を閉じるためのホバー終了。 */
  onPreviewLeave?: (() => void) | undefined;
}

const ROW_CLASS_NAME =
  'relative flex items-center rounded-xl pr-2 text-left text-[15px] transition-colors hover:bg-sidebar-hover';

const FOLDER_DROP_CLASS_NAME = 'bg-sidebar-hover ring-1 ring-inset ring-sidebar-muted/50';

const DROP_DATA_ATTRIBUTES = {
  'data-drop-section': 'bookmark',
  'data-drop-kind': 'bookmark',
} as const;

/** 1段あたりのインデント幅。行要素そのものを右へずらす。 */
export const ROW_INDENT_STEP = 16;

/** 行要素の左端から内容までの余白。 */
export const ROW_HORIZONTAL_PADDING = 10;

export function rowStyle(depth: number): { marginLeft: string; paddingLeft: string } {
  return {
    marginLeft: `${depth * ROW_INDENT_STEP}px`,
    paddingLeft: `${ROW_HORIZONTAL_PADDING}px`,
  };
}

export function openContextMenu(
  event: MouseEvent<HTMLElement>,
  onOpenContextMenu: (position: ContextMenuPosition) => void,
): void {
  event.preventDefault();
  onOpenContextMenu({ x: event.clientX, y: event.clientY });
}

function FolderIcon({ expanded, peeked }: { expanded: boolean; peeked: boolean }) {
  const Icon = expanded ? FolderOpen : Folder;
  return (
    <Icon aria-hidden="true" strokeWidth={1.5} className="size-5 shrink-0">
      {!expanded && peeked && (
        <>
          <circle cx="7.5" cy="13" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="13" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="13" r="1.1" fill="currentColor" stroke="none" />
        </>
      )}
    </Icon>
  );
}

export function BookmarkRow({
  id,
  parentId,
  index,
  title,
  url,
  depth,
  onClick,
  onOpenContextMenu,
}: BookmarkRowProps) {
  const { source, beginPress } = useDragContext();
  const isSourceDragging = source?.section === 'bookmark' && source.id === id;

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    beginPress(
      event,
      { section: 'bookmark', id },
      { kind: 'bookmark', bookmark: { id, parentId, index, title, url } },
    );
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onContextMenu={(event) => {
        openContextMenu(event, onOpenContextMenu);
      }}
      data-drop-id={id}
      {...DROP_DATA_ATTRIBUTES}
      data-bookmark-row-id={id}
      className={[
        ROW_CLASS_NAME,
        'h-10',
        'gap-3 text-sidebar-text',
        isSourceDragging ? 'hidden' : '',
      ].join(' ')}
      style={rowStyle(depth)}
    >
      <Favicon key={url} url={url} />
      <span className="truncate">{title}</span>
    </button>
  );
}

export function BookmarkFolderRow({
  id,
  title,
  depth,
  expanded,
  isDropTarget,
  peeked = false,
  dropSection = 'bookmark',
  heightClass = 'h-10',
  onToggle,
  onOpenContextMenu,
  onPreviewEnter,
  onPreviewLeave,
}: BookmarkFolderRowProps) {
  return (
    <button
      type="button"
      title={title}
      aria-expanded={expanded}
      onClick={onToggle}
      onContextMenu={(event) => {
        openContextMenu(event, onOpenContextMenu);
      }}
      onPointerEnter={onPreviewEnter}
      onPointerLeave={onPreviewLeave}
      data-drop-section={dropSection}
      data-drop-id={id}
      data-drop-kind="folder"
      data-drop-expanded={expanded ? 'true' : 'false'}
      data-folder-peeked={peeked ? 'true' : 'false'}
      data-bookmark-row-id={id}
      aria-description={peeked ? '開いているピンを含みます' : undefined}
      className={[
        ROW_CLASS_NAME,
        heightClass,
        'gap-1.5 font-semibold text-sidebar-text',
        isDropTarget ? FOLDER_DROP_CLASS_NAME : '',
      ].join(' ')}
      style={rowStyle(depth)}
    >
      <FolderIcon expanded={expanded} peeked={peeked} />
      <span className="truncate">{title}</span>
    </button>
  );
}
