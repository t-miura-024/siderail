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
  dropSection?: TreeSection;
  onToggle: () => void;
  onOpenContextMenu: (position: ContextMenuPosition) => void;
}

const ROW_CLASS_NAME =
  'relative flex h-8 w-full items-center rounded-lg pr-2 text-left text-[15px] transition-colors hover:bg-sidebar-hover';

const FOLDER_DROP_CLASS_NAME = 'bg-sidebar-hover ring-1 ring-inset ring-sidebar-muted/50';

const DROP_DATA_ATTRIBUTES = {
  'data-drop-section': 'bookmark',
  'data-drop-kind': 'bookmark',
} as const;

export function rowStyle(depth: number): { paddingLeft: string } {
  return { paddingLeft: `${8 + depth * 24}px` };
}

export function openContextMenu(
  event: MouseEvent<HTMLElement>,
  onOpenContextMenu: (position: ContextMenuPosition) => void,
): void {
  event.preventDefault();
  onOpenContextMenu({ x: event.clientX, y: event.clientY });
}

function FolderIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-5 shrink-0"
    >
      {expanded ? (
        <path
          d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M2.5 6.5a2 2 0 0 1 2-2h4.2l2 2h8.8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
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
      className={[ROW_CLASS_NAME, 'gap-3 text-sidebar-text', isSourceDragging ? 'hidden' : ''].join(
        ' ',
      )}
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
  dropSection = 'bookmark',
  onToggle,
  onOpenContextMenu,
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
      data-drop-section={dropSection}
      data-drop-id={id}
      data-drop-kind="folder"
      data-drop-expanded={expanded ? 'true' : 'false'}
      data-bookmark-row-id={id}
      className={[
        ROW_CLASS_NAME,
        'gap-1.5 font-semibold text-sidebar-text',
        isDropTarget ? FOLDER_DROP_CLASS_NAME : '',
      ].join(' ')}
      style={rowStyle(depth)}
    >
      <FolderIcon expanded={expanded} />
      <span className="truncate">{title}</span>
    </button>
  );
}
