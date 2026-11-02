import { useState, type MouseEvent, type PointerEvent } from 'react';
import type { BookmarkItemRowData } from '@/features/bookmarks/tree';
import { useDragContext } from '@/features/drag/DragProvider';
import type { Tab } from '@/lib/chrome';
import { openContextMenu, rowStyle, type ContextMenuPosition } from './BookmarkRow';
import { CloseIcon } from './CloseIcon';
import { Favicon } from './Favicon';
import { FaviconSwap } from './FaviconSwap';
import { SpeakerIcon } from './SpeakerIcon';

interface PinRowProps {
  row: BookmarkItemRowData;
  liveTab?: Tab | undefined;
  /** favicon クリックがピン元 URL へのリセットになるか。 */
  canReset: boolean;
  /** ⌘ / Ctrl が押されているか。 */
  modifierHeld: boolean;
  onActivate: () => void;
  onFaviconClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onClose: () => void;
  onToggleMute: (muted: boolean) => void;
  onOpenContextMenu: (position: ContextMenuPosition) => void;
}

/**
 * Arc 方式の Pinned の行。ブックマークを実体とし、対応するライブタブがあれば状態を表示する。
 *
 * - 行の高さは 40px 固定。ホバーしても伸びない
 * - 閉じているピンは favicon とタイトルを暗くする
 * - ピン元と違う URL を表示しているタブは、favicon の横に `/` を出す
 * - favicon のホバーで `/` を消し、ピン元の favicon に切り替え、
 *   タイトルを少し上へ寄せてサブタイトルを同じ高さの中に出す
 */
export function PinRow({
  row,
  liveTab,
  canReset,
  modifierHeld,
  onActivate,
  onFaviconClick,
  onClose,
  onToggleMute,
  onOpenContextMenu,
}: PinRowProps) {
  const { source, beginPress } = useDragContext();
  const [faviconHovered, setFaviconHovered] = useState(false);
  const isSourceDragging = source?.section === 'pin' && source.id === row.id;
  const isOpen = liveTab !== undefined;
  const isActive = liveTab?.active === true;
  const muted = liveTab?.mutedInfo?.muted === true;
  const showMedia = liveTab !== undefined && (liveTab.audible === true || muted);
  const showSubtitle = canReset && faviconHovered;
  const subtitle = modifierHeld ? 'ピンから切り離す' : 'ピン元の URL に戻す';
  const faviconLabel = canReset
    ? modifierHeld
      ? `${row.title} をピンから切り離す`
      : `${row.title} をピン元の URL に戻す`
    : isOpen
      ? `${row.title} のタブに切り替える`
      : `${row.title} を開く`;
  const faviconTitle = canReset
    ? modifierHeld
      ? 'ピンから切り離す'
      : 'ピン元の URL に戻す'
    : isOpen
      ? 'タブに切り替える'
      : '開く';

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
        'group relative h-10 rounded-xl text-[15px] transition-colors',
        isActive ? 'bg-sidebar-active' : 'hover:bg-sidebar-hover',
        isSourceDragging ? 'hidden' : '',
      ].join(' ')}
      style={{ ...rowStyle(row.depth), paddingLeft: 0 }}
      data-drop-section="pin"
      data-drop-id={row.id}
      data-drop-kind="bookmark"
      data-bookmark-row-id={row.id}
      data-pin-open={isOpen ? 'true' : 'false'}
      data-pin-navigated={canReset ? 'true' : 'false'}
      onContextMenu={(event) => {
        openContextMenu(event, onOpenContextMenu);
      }}
    >
      <div className="flex h-full">
        <button
          type="button"
          onClick={onFaviconClick}
          onPointerEnter={() => {
            setFaviconHovered(true);
          }}
          onPointerLeave={() => {
            setFaviconHovered(false);
          }}
          onFocus={() => {
            setFaviconHovered(true);
          }}
          onBlur={() => {
            setFaviconHovered(false);
          }}
          aria-label={faviconLabel}
          title={faviconTitle}
          className={[
            'group/favicon flex w-10 shrink-0 items-center justify-center rounded-l-xl transition-colors',
            canReset ? 'hover:bg-white/10' : '',
          ].join(' ')}
        >
          <span
            className={[
              'transition-opacity',
              isOpen ? '' : 'opacity-50 group-hover:opacity-100',
            ].join(' ')}
          >
            {canReset && liveTab?.url !== undefined ? (
              <FaviconSwap currentUrl={liveTab.url} pinnedUrl={row.url} />
            ) : (
              <Favicon key={row.url} url={row.url} />
            )}
          </span>
        </button>

        <div className="flex min-w-0 flex-1 items-center pr-2 pl-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <button
              type="button"
              onClick={onActivate}
              onPointerDown={handlePointerDown}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex min-w-0 items-center text-left leading-tight transition-colors',
                isOpen ? 'text-sidebar-text' : 'text-sidebar-muted group-hover:text-sidebar-text',
              ].join(' ')}
            >
              <span className="min-w-0 truncate">{row.title}</span>
            </button>

            {canReset && (
              <div
                className={[
                  'pointer-events-none grid transition-[grid-template-rows] duration-150 ease-out motion-reduce:transition-none',
                  showSubtitle ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                ].join(' ')}
              >
                <div className="overflow-hidden">
                  <span
                    aria-hidden="true"
                    className="block truncate pt-0.5 text-[11px] leading-tight text-sidebar-muted select-none"
                  >
                    {subtitle}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {liveTab !== undefined && (
          <div
            className={[
              'flex h-full shrink-0 items-center rounded-r-xl transition-colors hover:bg-white/10',
              showMedia ? 'w-16' : 'w-10',
            ].join(' ')}
          >
            {showMedia && (
              <button
                type="button"
                onClick={() => {
                  onToggleMute(!muted);
                }}
                aria-label={muted ? `${row.title} のミュートを解除` : `${row.title} をミュート`}
                title={muted ? 'ミュートを解除' : 'ミュート'}
                className="flex h-full w-6 items-center justify-center text-sidebar-muted transition-colors hover:text-sidebar-text focus-visible:outline-none"
              >
                <SpeakerIcon muted={muted} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={`${row.title} のタブを閉じる`}
              title="タブを閉じる"
              className="flex h-full flex-1 items-center justify-center text-sidebar-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-sidebar-text focus-visible:opacity-100 focus-visible:outline-none"
            >
              <CloseIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
