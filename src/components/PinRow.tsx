import type { PointerEvent } from 'react';
import type { BookmarkItemRowData } from '@/features/bookmarks/tree';
import { useDragContext } from '@/features/drag/DragProvider';
import type { Tab } from '@/lib/chrome';
import { openContextMenu, rowStyle, type ContextMenuPosition } from './BookmarkRow';
import { Favicon } from './Favicon';

interface PinRowProps {
  row: BookmarkItemRowData;
  liveTab?: Tab | undefined;
  /** favicon クリックがピン元 URL へのリセットになるか。 */
  canReset: boolean;
  onActivate: () => void;
  onFaviconClick: () => void;
  onClose: () => void;
  onToggleMute: (muted: boolean) => void;
  onOpenContextMenu: (position: ContextMenuPosition) => void;
}

const ACTION_BUTTON_CLASS_NAME =
  'flex size-7 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:text-sidebar-text';

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-4"
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinecap="round" strokeLinejoin="round" />
      {muted ? (
        <path d="m16 9 5 6M21 9l-5 6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.5 6a9 9 0 0 1 0 12" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/**
 * Arc 方式の Pinned の行。ブックマークを実体とし、対応するライブタブがあれば状態を表示する。
 */
export function PinRow({
  row,
  liveTab,
  canReset,
  onActivate,
  onFaviconClick,
  onClose,
  onToggleMute,
  onOpenContextMenu,
}: PinRowProps) {
  const { source, beginPress } = useDragContext();
  const isSourceDragging = source?.section === 'pin' && source.id === row.id;
  const isActive = liveTab?.active === true;
  const muted = liveTab?.mutedInfo?.muted === true;
  const showMedia = liveTab !== undefined && (liveTab.audible === true || muted);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    beginPress(
      event,
      { section: 'pin', id: row.id },
      {
        kind: 'pin',
        pin: {
          bookmarkId: row.id,
          parentId: row.parentId,
          index: row.index,
          title: row.title,
          url: row.url,
          tabId: liveTab?.id,
        },
      },
    );
  };

  return (
    <div
      className={[
        'group relative flex h-8 w-full items-center gap-3 rounded-lg text-[15px] transition-colors',
        isActive ? 'bg-sidebar-active' : 'hover:bg-sidebar-hover',
        liveTab === undefined
          ? 'pr-2'
          : showMedia
            ? 'pr-9 group-hover:pr-16'
            : 'pr-2 group-hover:pr-16',
        isSourceDragging ? 'hidden' : '',
      ].join(' ')}
      style={rowStyle(row.depth)}
      data-drop-section="pin"
      data-drop-id={row.id}
      data-drop-kind="bookmark"
      data-bookmark-row-id={row.id}
      onContextMenu={(event) => {
        openContextMenu(event, onOpenContextMenu);
      }}
    >
      <button
        type="button"
        onClick={onFaviconClick}
        aria-label={canReset ? `${row.title} をピン元の URL に戻す` : `${row.title} を開く`}
        title={canReset ? 'ピン元の URL に戻す' : '開く'}
        className="shrink-0 rounded"
      >
        <Favicon key={row.url} url={row.url} />
      </button>

      <button
        type="button"
        onClick={onActivate}
        onPointerDown={handlePointerDown}
        aria-current={isActive ? 'page' : undefined}
        className="flex min-w-0 flex-1 items-center text-left text-sidebar-text"
      >
        <span className="min-w-0 truncate">{row.title}</span>
      </button>

      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5">
        {showMedia && (
          <button
            type="button"
            onClick={() => {
              onToggleMute(!muted);
            }}
            aria-label={muted ? `${row.title} のミュートを解除` : `${row.title} をミュート`}
            title={muted ? 'ミュートを解除' : 'ミュート'}
            className={ACTION_BUTTON_CLASS_NAME}
          >
            <SpeakerIcon muted={muted} />
          </button>
        )}
        {liveTab !== undefined && (
          <button
            type="button"
            onClick={onClose}
            aria-label={`${row.title} のタブを閉じる`}
            title="タブを閉じる"
            className={[
              ACTION_BUTTON_CLASS_NAME,
              'pointer-events-none text-2xl leading-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100',
            ].join(' ')}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
