import type { PointerEvent } from 'react';
import { useDragContext } from '@/features/drag/DragProvider';
import { getTabTitle } from '@/features/tabs/tabs';
import type { Tab } from '@/lib/chrome';
import { activateTab, closeTab } from '@/lib/chrome';
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
      className={['group relative', isSourceDragging ? 'hidden' : ''].join(' ')}
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
        className={[
          // × ボタンが表示されている間だけ、その行の右側に × の幅を確保する。
          'flex h-8 w-full items-center gap-3 rounded-lg py-0 pr-2 pl-2 text-left text-[15px] transition-colors',
          'group-hover:pr-9 group-has-[>button[data-tab-close]:focus-visible]:pr-9',
          tab.active
            ? 'bg-sidebar-active text-sidebar-text'
            : 'text-sidebar-text group-hover:bg-sidebar-hover',
        ].join(' ')}
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
        className="pointer-events-none absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-2xl leading-none text-sidebar-muted opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 hover:text-sidebar-text"
      >
        ×
      </button>
    </div>
  );
}
