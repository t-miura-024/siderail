import type { Tab } from '@/lib/chrome';
import { getTabTitle } from '@/features/tabs/tabs';
import { openContextMenu, type ContextMenuPosition } from './BookmarkRow';
import { Favicon } from './Favicon';

interface UnmappedPinRowProps {
  tab: Tab;
  onActivate: () => void;
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
        'group relative flex h-8 w-full items-center gap-3 rounded-lg pr-2 text-[15px] transition-colors',
        tab.active ? 'bg-sidebar-active' : 'hover:bg-sidebar-hover',
      ].join(' ')}
      style={{ paddingLeft: '8px' }}
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
            'pointer-events-none text-2xl leading-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100',
          ].join(' ')}
        >
          ×
        </button>
      </div>
    </div>
  );
}
