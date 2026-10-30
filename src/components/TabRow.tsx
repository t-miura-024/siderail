import { useState } from 'react';
import { getTabTitle } from '@/features/tabs/tabs';
import type { Tab } from '@/lib/chrome';
import { activateTab, closeTab, getFaviconUrl } from '@/lib/chrome';

interface TabRowProps {
  tab: Tab;
}

function TabFavicon({ pageUrl }: { pageUrl: string | undefined }) {
  const [failed, setFailed] = useState(false);

  if (pageUrl === undefined || failed) {
    return (
      <span aria-hidden="true" className="size-5 shrink-0 rounded-[4px] bg-sidebar-skeleton" />
    );
  }

  return (
    <img
      src={getFaviconUrl(pageUrl)}
      alt=""
      className="size-5 shrink-0 object-contain"
      onError={() => {
        setFailed(true);
      }}
    />
  );
}

export function TabRow({ tab }: TabRowProps) {
  const title = getTabTitle(tab);

  const handleActivate = () => {
    if (tab.id === undefined) {
      return;
    }

    activateTab(tab.id).catch((error: unknown) => {
      console.error('タブの切り替えに失敗しました', error);
    });
  };

  const handleClose = () => {
    if (tab.id === undefined) {
      return;
    }

    closeTab(tab.id).catch((error: unknown) => {
      console.error('タブを閉じるのに失敗しました', error);
    });
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handleActivate}
        aria-current={tab.active ? 'page' : undefined}
        className={[
          'flex h-[46px] w-full items-center gap-3 rounded-xl py-0 pr-9 pl-2 text-left text-[15px] transition-colors',
          tab.active
            ? 'bg-sidebar-active text-sidebar-text'
            : 'text-sidebar-text group-hover:bg-sidebar-hover',
        ].join(' ')}
      >
        <TabFavicon key={tab.url} pageUrl={tab.url} />
        <span className="min-w-0 truncate">{title}</span>
      </button>
      <button
        type="button"
        onClick={handleClose}
        aria-label={`${title} を閉じる`}
        title="タブを閉じる"
        className="pointer-events-none absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-base leading-none text-sidebar-muted opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 hover:text-sidebar-text"
      >
        ×
      </button>
    </div>
  );
}
