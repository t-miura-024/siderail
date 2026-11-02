import type { PointerEvent } from 'react';
import { useDragContext } from '@/features/drag/DragProvider';
import { getTabTitle } from '@/features/tabs/tabs';
import type { Tab } from '@/lib/chrome';
import { activateTab, closeTab } from '@/lib/chrome';
import { CloseIcon } from './CloseIcon';
import { Favicon } from './Favicon';

interface TabRowProps {
  tab: Tab;
  targetId: string;
}

export function TabRow({ tab, targetId }: TabRowProps) {
  const title = getTabTitle(tab);
  const { source, beginPress } = useDragContext();
  const isSourceDragging = source?.section === 'tab' && source.id === targetId;

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

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (tab.url === undefined) {
      return;
    }

    beginPress(
      event,
      { section: 'tab', id: targetId },
      { kind: 'tab', tab: { id: tab.id, title, url: tab.url } },
    );
  };

  return (
    <div
      className={[
        'group relative flex h-8 rounded-xl transition-colors',
        tab.active ? 'bg-sidebar-active' : 'hover:bg-sidebar-hover',
        isSourceDragging ? 'hidden' : '',
      ].join(' ')}
      data-drop-section="tab"
      data-drop-id={targetId}
      data-drop-kind="tab"
      data-tab-row-id={targetId}
    >
      <button
        type="button"
        onClick={handleActivate}
        onPointerDown={handlePointerDown}
        aria-current={tab.active ? 'page' : undefined}
        className="flex h-full min-w-0 flex-1 items-center gap-3 py-0 pr-2 pl-2 text-left text-[15px] text-sidebar-text"
      >
        <Favicon key={tab.url} url={tab.url} />
        <span className="min-w-0 truncate">{title}</span>
      </button>
      <button
        type="button"
        onClick={handleClose}
        aria-label={`${title} を閉じる`}
        title="タブを閉じる"
        data-tab-close
        className="flex h-full w-8 shrink-0 items-center justify-center rounded-r-xl text-sidebar-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10 hover:text-sidebar-text focus-visible:opacity-100 focus-visible:outline-none"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
