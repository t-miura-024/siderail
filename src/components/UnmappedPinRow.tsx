import type { Tab } from '@/lib/chrome';
import { getTabTitle } from '@/features/tabs/tabs';
import { openContextMenu, ROW_HORIZONTAL_PADDING, type ContextMenuPosition } from './BookmarkRow';
import { CloseIcon } from './CloseIcon';
import { Favicon } from './Favicon';
import { SpeakerIcon } from './SpeakerIcon';

interface UnmappedPinRowProps {
  tab: Tab;
  onActivate: () => void;
  onClose: () => void;
  onToggleMute: (muted: boolean) => void;
  onOpenContextMenu: (position: ContextMenuPosition) => void;
}

const ACTION_BUTTON_CLASS_NAME =
  'flex size-7 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:text-sidebar-text';

/**
 * Chrome 側でピン留めされたまま、対応するブックマークがない行。
 * 並び順を保存できないためドラッグには対応しない。
 */
export function UnmappedPinRow({
  tab,
  onActivate,
  onClose,
  onToggleMute,
  onOpenContextMenu,
}: UnmappedPinRowProps) {
  const title = getTabTitle(tab);
  const muted = tab.mutedInfo?.muted === true;
  const showMedia = tab.audible === true || muted;

  return (
    <div
      className={[
        'group relative flex h-10 w-full items-center gap-3 rounded-xl pr-2 text-[15px] transition-colors',
        tab.active ? 'bg-sidebar-active' : 'hover:bg-sidebar-hover',
      ].join(' ')}
      style={{ paddingLeft: `${ROW_HORIZONTAL_PADDING}px` }}
      onContextMenu={(event) => {
        openContextMenu(event, onOpenContextMenu);
      }}
    >
      <span className="shrink-0">
        <Favicon key={tab.url} url={tab.url} />
      </span>

      <button
        type="button"
        onClick={onActivate}
        aria-current={tab.active ? 'page' : undefined}
        className="flex min-w-0 flex-1 items-center text-left text-sidebar-text"
      >
        <span className="min-w-0 truncate">{title}</span>
      </button>

      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5">
        {showMedia && (
          <button
            type="button"
            onClick={() => {
              onToggleMute(!muted);
            }}
            aria-label={muted ? `${title} のミュートを解除` : `${title} をミュート`}
            title={muted ? 'ミュートを解除' : 'ミュート'}
            className={ACTION_BUTTON_CLASS_NAME}
          >
            <SpeakerIcon muted={muted} />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={`${title} のタブを閉じる`}
          title="タブを閉じる"
          className={[
            ACTION_BUTTON_CLASS_NAME,
            'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100',
          ].join(' ')}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
